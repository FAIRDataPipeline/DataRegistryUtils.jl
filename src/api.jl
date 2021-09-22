"""
    initialise(config_file, submission_script)

Read [working] config.yaml file. Returns a `DataRegistryHandle` containing:
- the working config.yaml file contents
- the object id for this file
- the object id for the submission script file
"""
function initialise(config_file::String, submission_script::String)
   # Read working config file
   print("processing config file: ", config_file)
   config = YAML.load_file(config_file)

   # Register datastore 
   datastore = config["run_metadata"]["write_data_store"]
   register_path = "file://$datastore"
   storage_root_query = Dict("root" => register_path, "local" => true)
   storage_root_uri = DataPipeline.http_post_data("storage_root", storage_root_query)
   
   # Register config file
   config_hash = DataPipeline.get_file_hash(config_file)
   config_obj_uri = DataPipeline.register_object(config_file, config_hash, "Working config file.", storage_root_uri, "yaml")
   
   # Register submission script   
   script_hash = DataPipeline.get_file_hash(submission_script)
   script_obj_uri = DataPipeline.register_object(submission_script, script_hash, "Submission script (Julia.)", storage_root_uri, "sh")

   # Register remote repository
   remote_repo = config["run_metadata"]["remote_repo"]
   repo_root = match(r"([a-z]*://[a-z]*.[a-z]*/).*", remote_repo)[1]
   remote_repo = replace(remote_repo, repo_root => "")
   repo_root_query = Dict("root" => repo_root, "local" => false)
   repo_root_uri = DataPipeline.http_post_data("storage_root", repo_root_query)
   latest_commit = config["run_metadata"]["latest_commit"]
   repo_obj_url = DataPipeline.register_object(remote_repo, latest_commit, "Remote code repository.", repo_root_uri, public=false)

   # Register code run
   rt = Dates.now()
   rt = Dates.format(rt, "yyyy-mm-dd HH:MM:SS")
   coderun_description = config["run_metadata"]["description"]
   body = Dict("run_date" => rt, "description" => coderun_description, "code_repo" => repo_obj_url, "model_config" => config_obj_uri, 
   "submission_script" => script_obj_uri)

   coderun_url = DataPipeline.http_post_data("code_run", body)

   println(" - pipeline initialised.")
   
   # Write to handle
   return DataRegistryHandle(config, config_obj_uri, script_obj_uri, repo_obj_url, storage_root_uri, coderun_url, Dict(), Dict())
end

"""
    finalise(handle)

Complete (i.e. finish) code run.
"""
function finalise(handle::DataRegistryHandle)

   # Register inputs
   inputs = Vector{String}()
   for (key, value) in handle.inputs
      dp_url = handle.inputs[key]["component_url"]
      dp_url = isa(dp_url, Vector) ? dp_url[1] : dp_url
      push!(inputs, dp_url)
   end
   
   # Register outputs
   outputs = Vector{String}()
   for (key, value) in handle.outputs
      dp_url = DataPipeline.register_data_product(handle, key)
      push!(outputs, dp_url)
   end
   
   # Register code run
   url = DataPipeline.patch_code_run(handle, inputs, outputs)
   println("finished - code run locally registered as: ", url, "\n")
   #output = (code_run=url, config_obj=handle.config_obj, script_obj=handle.script_obj)
   #isnothing(handle.repo_obj) && (return output)
   #return (; output..., repo_obj=handle.repo_obj)
end

"""
    link_read(handle, data_product)

Returns the file path of a data product that has been registered in the local data registry, either directly or via the CLI.
"""
function link_read(handle::DataRegistryHandle, data_product::String)
   # Get metadata
   rmd = get_dp_metadata(handle, data_product, "read")
   use_data_product = get(rmd["use"], "data_product", data_product)
   use_namespace = get(rmd["use"], "namespace", handle.config["run_metadata"]["default_input_namespace"])
   use_version = rmd["use"]["version"]
   
   # Is the data product already in the registry?
   namespace_id = get_id("namespace", Dict("name" => use_namespace))
   dp_entry = DataPipeline.get_entry("data_product", Dict("name" => use_data_product, "namespace" => namespace_id, "version" => use_version))

   if isnothing(dp_entry)
      # If the data product isn't in the registry, throw an error
      msg = string("no data products found matching: ", use_data_product, " :-(ns: ", use_namespace, " - v: ", use_version, ")")
      throw(ReadWriteException(msg))
   else 
      # Get object entry
      obj_url = dp_entry["object"]
      println("data product found: ", use_data_product, " (url: ", dp_entry["url"], ")")
       
      # Get component url 
      object_entry = DataPipeline.http_get_json(obj_url)
      component_url = object_entry["components"]
      @assert length(component_url) == 1

      # Get storage location
      path = DataPipeline.get_storage_loc(obj_url)
      path = replace(path, "file://" => "")
      
      # Add metadata to handle
      metadata = Dict("use_dp" => use_data_product, "use_namespace" => use_namespace, "use_version" => use_version, "component_url" => component_url)
      handle.inputs[data_product] = metadata
      
      # Return storage location
      return path
   end
end

"""
    read_array(handle, data_product[, component])

Read [array] data product.
- note that it must already have been downloaded from the remote data store using `fdp pull`.
- the latest version of the data is read unless otherwise specified.
"""
function read_array(handle::DataRegistryHandle, data_product::String, component=nothing)
   ## 1. API call to LDR
   tmp = DataPipeline.read_data_product(handle, data_product, component)
   # println("RDP: ", tmp)
   ## 2. read array from file -> process
   output = process_h5_file(tmp, false, C_DEBUG_MODE)
   return output
end

"""
    read_table(handle, data_product[, component])

Read [table] data product.
- note that it must already have been downloaded from the remote data store using `fdp pull`.
- the latest version of the data is read unless otherwise specified.
"""
function read_table(handle::DataRegistryHandle, data_product::String, component=nothing)
   ## 1. API call to LDR
   tmp = read_data_product(handle, data_product, component)
   ## 2. read array from file -> process
   output = CSV.read(tmp, DataFrames.DataFrame)
   return output
end

"""
    read_estimate(handle, data_product, [component])

Read TOML-based data product.
- note that it must already have been downloaded from the remote data store using `fdp pull`.
- the specific version can be specified in the config file (else the latest version is used.)
"""
function read_estimate(handle::DataRegistryHandle, data_product::String, component=nothing)
   output = read_toml(handle, data_product, component)
   isnothing(component) && (return output)
   return output["value"]
end

"""
   read_distribution(handle, data_product, [component])

Read TOML-based data product.
- note that it must already have been downloaded from the remote data store using `fdp pull`.
- the specific version can be specified in the config file (else the latest version is used.)
"""
function read_distribution(handle::DataRegistryHandle, data_product::String, component=nothing)
   return read_toml(handle, data_product, component)
end

"""
   link_write(handle, data_product)

Registers a file-based data product based on information provided in the working config file, e.g. for writing external objects.
"""
function link_write(handle::DataRegistryHandle, data_product::String)
   # Get metadata
   wmd = DataPipeline.get_dp_metadata(handle, data_product, "write")
   data_store = handle.config["run_metadata"]["write_data_store"]
   use_namespace = get(wmd["use"], "namespace", handle.config["run_metadata"]["default_output_namespace"])
   use_data_product = get(wmd["use"], "data_product", data_product)
   use_version = wmd["use"]["version"]
   public = get(wmd["use"], "public", handle.config["run_metadata"]["public"])
   filetype = wmd["file_type"]
   description = wmd["description"]

   # Create storage location
   filename = "xxxxxxxxxx.$filetype"
   directory = joinpath(data_store, use_namespace, use_data_product)

   # Create directory
   mkpath(directory)
   path = joinpath(directory, filename)

   # Add metadata to handle
   metadata = Dict("use_dp" => use_data_product, "use_namespace" => use_namespace, "use_version" => use_version, "path" => path, "public" => public, "description" => description)
   handle.outputs[data_product] = metadata

   # Return path
   return path
end

"""
    write_array(handle, data, data_product, component)

Write an array as a component to an hdf5 file.
"""
function write_array(handle::DataRegistryHandle, data::Array, data_product::String, component::String)
   # Get storage location and write to metadata to handle
   path = resolve_write(handle, data_product, component, "h5")
   
   # Write array
   fid = HDF5.h5open(path, "w")
   fid[component] = data
   HDF5.close(fid)         
    
   return nothing
end

"""
    write_table(handle, data, data_product, component)

Write a table as a component to an hdf5 file.
"""
function write_table(handle::DataRegistryHandle, data, data_product::String, component::String)
   write_array(handle, data, data_product, component)
end

"""
    write_estimate(handle, value, data_product, component)

Write a point estimate as a component to a toml file.
"""
function write_estimate(handle::DataRegistryHandle, value, data_product::String, component::String)
   data = Dict(component => Dict{String,Any}("value" => value, "type" => "point-estimate"))
   return write_keyval(handle, data, data_product, component)
end

"""
    write_distribution(handle, distribution, parameters, data_product, component)

Write a distribution as a component to a toml file.
"""
function write_distribution(handle::DataRegistryHandle, distribution::String, parameters, data_product::String, component::String)
   data = Dict(component => Dict{String,Any}("distribution"=>distribution, "parameters"=>parameters, "type"=>"distribution"))
   return write_keyval(handle, data, data_product, component)
end

## register issue with data product; component; externalobject; or script
"""
    raise_issue(handle; ... )

Register issue with data product; component; external object; or script.

Pass the object URI as a named parameter[s], e.g. `raise_issue(handle; data_product=dp, component=comp)`.

**Optional parameters**
- `data_product`
- `component`
- `external_object`
- `script`
"""
function raise_issue(handle::DataRegistryHandle, url::String, description::String, severity=0)#data_product=nothing, component=nothing, external_object=nothing, script=nothing
   ## 1. API call to LDR (retrieve metadata)
   c = get_object_components(url)
   # println(c)
   ## 2. register issue to LDR
   body = (severity=severity, description=description, component_issues=c)
   resp = http_post_data("issue", body)
   println("nb. issue registered as ", resp["url"])
   return resp["url"]
end