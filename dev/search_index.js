var documenterSearchIndex = {"docs":
[{"location":"examples/#Simple-example","page":"Simple example","title":"Simple example","text":"","category":"section"},{"location":"examples/#Introduction","page":"Simple example","title":"Introduction","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Here, we use a simplistic example to demonstrate use of the package to interact with the SCRC Data Registry (DR) in a process referred to as the 'pipeline', including:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"How to read data products from the DR,\nutilise them in a simple simulation model,\nregister model code releases,\nand register model runs.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"The example is also provided as working code (including the accompanying configuration files) in the examples/simple directory of the package repository. The steps and the corresponding line of code in that module are:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Steps Code\n1. Preliminaries L22\n2. Config files and scripts L30\n3. Register 'code repo release' [model code] in the DR L40\n4. Read data products from the DR L66\n5. Run model simulation L85\n6. Register model 'code run' in the DR L122","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"# wrkd = \"/media/martin/storage/projects/AtomProjects/DataRegistryUtils.jl\"; # hide","category":"page"},{"location":"examples/#.-Package-installation","page":"Simple example","title":"0. Package installation","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"The package is not currently registered and must be added via the package manager Pkg. From the REPL type ] to enter Pkg mode and run:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"pkg> add https://github.com/ScottishCovidResponse/DataRegistryUtils.jl","category":"page"},{"location":"examples/#.-Preliminaries:-import-packages","page":"Simple example","title":"1. Preliminaries: import packages","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"import DataRegistryUtils    # pipeline stuff\nimport DPOMPs               # simulation of epidemiological models\nimport YAML                 # for reading model config file\nimport Random               # other assorted packages used incidentally\nimport DataFrames","category":"page"},{"location":"examples/#.-Specify-config-files,-scripts-and-data-directory","page":"Simple example","title":"2. Specify config files, scripts and data directory","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"These variables and the corresponding files determine the model configuration; data products to be downloaded; and the local directory where the downloaded files are to be saved.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"model_config = \"/examples/simple/model_config.yaml\";\ndata_config = \"/examples/simple/data_config.yaml\";\ndata_dir = \"/examples/simple/data/\";\nsubmission_script = \"julia examples/simple/main.jl\";","category":"page"},{"location":"examples/#.-Registering-model-code","page":"Simple example","title":"3. Registering model code","text":"","category":"section"},{"location":"examples/#SCRC-access-token-request-via-https://data.scrc.uk/docs/","page":"Simple example","title":"SCRC access token - request via https://data.scrc.uk/docs/","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"An access token is required if you want to write to the DR (e.g. register model code / runs) but not necessary if you only want to read from the DR (e.g. download data products.)","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"The token must not be shared. Common approaches include the use of system variables or [private] configuration files. In this example I have included mine as a separate Julia file with a single line of code. Note that it is important to also specify the .gitignore so as not to accidentally upload to the internet!","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"julia> include(\"access-token.jl\")","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Allowing that the token is the numbers one through six, the access-token.jl file looks like this:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"const scrc_access_tkn = \"token 123456\"","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Back in the main file, we handle model code [release] registration by calling a function that automatically returns the existing CodeRepoRelease URI if it is already registered, or a new one if not.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"julia> code_release_id = DataRegistryUtils.register_github_model(model_config, scrc_access_tkn)","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Here we have used a .yaml configuration file but for illustration, the code is roughly equivalent to this:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"model_name = \"DRU simple example\"\nmodel_repo = \"https://github.com/ScottishCovidResponse/DataRegistryUtils.jl\"\nmodel_version = \"0.0.1\"\nmodel_description = \" ... \" (nb. insert description)\nmodel_docs = \"https://mjb3.github.io/DiscretePOMP.jl/stable/\"\ncode_release_id = DataRegistryUtils.register_github_model(model_name, model_version, model_repo, model_hash, scrc_access_tkn, model_description=model_description, model_website=model_docs)","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Finally, the resulting URI is in the form:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"code_release_id := \"https://data.scrc.uk/api/code_repo_release/2157/\"","category":"page"},{"location":"examples/#.-Downloading-data-products","page":"Simple example","title":"4. Downloading data products","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Here we read some epidemiological parameters from the DR, so we can use them to run an SEIR simulation in step (5).","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"First, we process data config file and return a connection to the SQLite database. I.e. we download the data products:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"println(pwd())\ndb = DataRegistryUtils.fetch_data_per_yaml(data_config, data_dir, use_sql=true, verbose=false)","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Next, we read some parameters and convert them to the required units.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"inf_period_days = DataRegistryUtils.read_estimate(db, \"human/infection/SARS-CoV-2/%\", \"infectious-duration\", data_type=Float64)[1] / 24\nlat_period_days = DataRegistryUtils.read_estimate(db, \"human/infection/SARS-CoV-2/%\", \"latent-period\", data_type=Float64)[1] / 24","category":"page"},{"location":"examples/#.-Model-simulation","page":"Simple example","title":"5. Model simulation","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Now we run a brief SEIR simulation using the Gillespie simulation feature of the DiscretePOMP.jl package. We use the downloaded parameters* as inputs, and finally plot the results as a time series of the population compartments.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"First we process the model config .yaml file:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"mc = YAML.load_file(model_config)\np = mc[\"initial_s\"]   # population size\nt = mc[\"max_t\"]       # simulation time\nbeta = mc[\"beta\"]     # nb. contact rate := beta SI / N\nRandom.seed!(mc[\"random_seed\"])","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Note that the population size and contact parameter beta (as well as the random seed) are read from the model_config.yaml file instead.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"We are then ready the generate a DPOMP model:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"## define a vector of simulation parameters\ntheta = [beta, inf_period_days^-1, lat_period_days^-1]\n## initial system state variable [S E I R]\ninitial_condition = [p - 1, 0, 1, 0]\n## generate DPOMPs model (see https://github.com/mjb3/DiscretePOMP.jl)\nmodel = DPOMPs.generate_model(\"SEIR\", initial_condition, freq_dep=true)","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Finally, we run the simulation and plot the results:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"x = DPOMPs.gillespie_sim(model, theta, tmax=t)\nprintln(DPOMPs.plot_trajectory(x))","category":"page"},{"location":"examples/#.-Registering-a-'model-run'","page":"Simple example","title":"6. Registering a 'model run'","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Lastly, we register the results of this particular simulation by POSTing to the CodeRun endpoint of the DR's RESTful API:","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"julia> model_run_description = \"Just another SEIR simulation.\"\njulia> model_run_id = DataRegistryUtils.register_model_run(model_config, submission_script,\n    code_release_id, model_run_description, scrc_access_tkn)","category":"page"},{"location":"examples/#Finished!","page":"Simple example","title":"Finished!","text":"","category":"section"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"That concludes the example.","category":"page"},{"location":"examples/","page":"Simple example","title":"Simple example","text":"Please note that certain features, notably the registration of Data Products (i.e. model 'inputs' and 'outputs') is currently still a work in progress. See the home page for more information.","category":"page"},{"location":"snip/#Code-snippets","page":"Code snippets","title":"Code snippets","text":"","category":"section"},{"location":"snip/#Getting-started-package-installation","page":"Code snippets","title":"Getting started - package installation","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"The package is not currently registered and must be added via the package manager Pkg. From the REPL type ] to enter Pkg mode and run:","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"pkg> add https://github.com/ScottishCovidResponse/DataRegistryUtils.jl","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"using DataRegistryUtils\n?fetch_data_per_yaml","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"NB. a complete working example of this code is also provided in the examples folder.","category":"page"},{"location":"snip/#Usage","page":"Code snippets","title":"Usage","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"It is recommended to use a .yaml data configuration file to specify the data products to be downloaded. Some example .yaml file are included in the examples folder. Refer to https://data.scrc.uk/ for information about other data products available in the registry.","category":"page"},{"location":"snip/#Example:-refesh-data","page":"Code snippets","title":"Example: refesh data","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"julia> TEST_FILE = \"examples/data_config.yaml\"\njulia> DATA_OUT = \"out/\"\njulia> data = DataRegistryUtils.fetch_data_per_yaml(TEST_FILE, DATA_OUT, use_axis_arrays=true, verbose=false)","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"The results referenced by the data variable are a Dict of data products, indexed by data product name, component name, and so on. They can be accessed thusly:","category":"page"},{"location":"snip/#Example:-access-data-product-by-name","page":"Code snippets","title":"Example: access data product by name","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"julia> data_product = data[\"human/infection/SARS-CoV-2/symptom-delay\"]\njulia> component = data_product[\"symptom-delay\"]\njulia> component_type = component[\"type\"]\njulia> distribution_name = component[\"distribution\"]","category":"page"},{"location":"snip/#Example:-read-individual-HDF5-or-TOML-file","page":"Code snippets","title":"Example: read individual HDF5 or TOML file","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"You can also use the package to read in a file that has already been downloaded, as follows:","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"julia> fp = \"/path/to/some/file.h5\"\njulia> dp = DataRegistryUtils.read_data_product_from_file(fp, use_axis_arrays = true, verbose = false)\njulia> component = dp[\"/conversiontable/scotland\"]","category":"page"},{"location":"snip/#Example:-read-data-as-SQLite-connection","page":"Code snippets","title":"Example: read data as SQLite connection","text":"","category":"section"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"Data can be staged using SQLite and returned as an active connection to a file database for querying and aggregation. For example:","category":"page"},{"location":"snip/","page":"Code snippets","title":"Code snippets","text":"julia> using SQLite, DataFrames\njulia> db = DataRegistryUtils.read_data_product(fp, use_sql = true)\njulia> x = DBInterface.execute(db, \"SELECT * FROM data_product\") |> DataFrame","category":"page"},{"location":"manual/#Package-manual","page":"Package manual","title":"Package manual","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"Pages = [\"manual.md\"]\nDepth = 3","category":"page"},{"location":"manual/#Reading-/-downloading-data","page":"Package manual","title":"Reading / downloading data","text":"","category":"section"},{"location":"manual/#Process-data-products","page":"Package manual","title":"Process data products","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"fetch_data_per_yaml","category":"page"},{"location":"manual/#DataRegistryUtils.fetch_data_per_yaml","page":"Package manual","title":"DataRegistryUtils.fetch_data_per_yaml","text":"fetch_data_per_yaml(yaml_filepath, out_dir = \"./out/\"; use_axis_arrays::Bool = false, verbose = false, ...)\n\nRefresh and load data products from the SCRC data registry. Checks the file hash for each data product and downloads anew any that are determined to be out-of-date.\n\nParameters\n\nyaml_filepath       – the location of a .yaml file.\nout_dir             – the local system directory where data will be stored.\nuse_axis_arrays     – convert the output to AxisArrays, where applicable.\nuse_sql             – load SQLite database and return connection.\nsql_file            – (optional) SQL file for e.g. custom SQLite views, indexes, or whatever.\ndb_path             – (optional) specify the filepath of the database to use (or create.)\nforce_db_refresh    – overide filehash check on database insert.\n'accesslogpath'     – filepath of .yaml access log.\nverbose             – set to true to show extra output in the console.\n\n\n\n\n\n","category":"function"},{"location":"manual/#Reading-data","page":"Package manual","title":"Reading data","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"read_table\nread_estimate\nread_data_product_from_file","category":"page"},{"location":"manual/#DataRegistryUtils.read_table","page":"Package manual","title":"DataRegistryUtils.read_table","text":"read_table(cn::SQLite.DB, data_product::String, [component::String]; data_type=nothing)\n\nSQLite Data Registry helper function. Search and return [HDF5] table data as a DataFrame.\n\nParameters\n\ncn              – SQLite.DB object.\ndata_product    – data product search string, e.g. 'human/infection/SARS-CoV-2/%'.\ncomponent       – as above, [required] search string for components names.\n\n\n\n\n\n","category":"function"},{"location":"manual/#DataRegistryUtils.read_estimate","page":"Package manual","title":"DataRegistryUtils.read_estimate","text":"read_estimate(cn::SQLite.DB, data_product::String, [component::String]; data_type=nothing)\n\nSQLite Data Registry helper function. Search TOML-based data resources stored in cn, a SQLite database created previously by a call to fetch_data_per_yaml.\n\nParameters\n\ncn              – SQLite.DB object.\ndata_product    – data product search string, e.g. 'human/infection/SARS-CoV-2/%'.\ncomponent       – as above, optional search string for components names.\ndata_type       – (optional) specify to return an array of this type, instead of a DataFrame.\n\n\n\n\n\n","category":"function"},{"location":"manual/#DataRegistryUtils.read_data_product_from_file","page":"Package manual","title":"DataRegistryUtils.read_data_product_from_file","text":"read_data_product_from_file(filepath; use_axis_arrays = false, verbose = false)\n\nRead HDF5 or TOML file from local system.\n\nParameters\n\nfilepath        – the location of an HDF5 or TOML file.\nuse_axis_arrays – convert the output to AxisArrays, where applicable.\nverbose         – set to true to show extra output in the console.\n\n\n\n\n\n","category":"function"},{"location":"manual/#Writing-to-the-Data-Registry","page":"Package manual","title":"Writing to the Data Registry","text":"","category":"section"},{"location":"manual/#Register-model","page":"Package manual","title":"Register model","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"register_github_model","category":"page"},{"location":"manual/#DataRegistryUtils.register_github_model","page":"Package manual","title":"DataRegistryUtils.register_github_model","text":"register_github_model(model_config, scrc_access_tkn; ... )\nregister_github_model(model_name, model_version, model_repo, scrc_access_tkn; ... )\n\nRegister model as a code_repo_release in the SCRC data registry, from GitHub (default) or another source.\n\nIf used, the model_config file should include (at a minimum) the model_name, model_version and model_repo fields. Else these can be passed directly to the function.\n\nParameters\n\nmodel_config        – path to the model config .yaml file.\nmodel_name          – label for the model release.\nmodel_version       – version number in the format 'n.n.n', e.g. 001.\nmodel_repo          – url of the model [e.g. GitHub] repo.\nscrc_access_tkn     – access token (see https://data.scrc.uk/docs/.)\nmodel_description   – (optional) description of the model.\nmodel_website       – (optional) website, e.g. for an accompanying paper, blog, or model documentation.\n\n\n\n\n\n","category":"function"},{"location":"manual/#Register-model-run","page":"Package manual","title":"Register model run","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"register_model_run","category":"page"},{"location":"manual/#DataRegistryUtils.register_model_run","page":"Package manual","title":"DataRegistryUtils.register_model_run","text":"register_model_run(model_config, code_repo_release_uri, model_run_description, scrc_access_tkn)\n\nUpload model run to the code_run endpoint of the SCRC Data Registry.\n\nParameters\n\nmodel_config            – path to the model config .yaml file.\nsubmission_script_text  – e.g. 'julia my/julia/code.jl'.\ncode_repo_release_uri   – Data Registry uri of the model code_repo_release, i.e. the model code such as an (already registered) GitHub repo.\nmodel_run_description   – description of the model run.\nscrc_access_tkn         – access token (see https://data.scrc.uk/docs/.)\n\n\n\n\n\n","category":"function"},{"location":"manual/#Other","page":"Package manual","title":"Other","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"register_text_file","category":"page"},{"location":"manual/#DataRegistryUtils.register_text_file","page":"Package manual","title":"DataRegistryUtils.register_text_file","text":"register_text_file(text, code_repo_release_uri, model_run_description, scrc_access_tkn, search=true)\n\nPost an entry to the text_file endpoint of the SCRC Data Registry.\n\nNote that according to the docs, \"\".\n\nParameters\n\ntext            – text file contents.\ndescription     – object description.\nscrc_access_tkn – access token (see https://data.scrc.uk/docs/.)\nsearch          – (optional, default=true) check for existing entry by path and file hash.\nhash_val        – (optional) specify the file hash, else it is computed based on text.\n\n\n\n\n\n","category":"function"},{"location":"manual/#Index","page":"Package manual","title":"Index","text":"","category":"section"},{"location":"manual/","page":"Package manual","title":"Package manual","text":"","category":"page"},{"location":"#Introduction","page":"Introduction","title":"Introduction","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"note: Note\nPlease note that this package is still in development.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"DataRegistryUtils.jl  -  the SCRC 'Data Pipeline' in Julia","category":"page"},{"location":"#What-is-the-SCRC-data-pipeline?","page":"Introduction","title":"What is the SCRC data pipeline?","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Per the SCRC docs, the Scottish COVID-19 Response Consortium [SCRC] is a research consortia \"formed of dozens of individuals from over 30 academic and commercial organisations\" focussed on COVID-related research.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"A key outcome of the project is to develop more epidemiological models of COVID-19 spread in order to develop a more robust and clearer understanding of the impacts of different exit strategies from lockdown - see the SCRC docs for more information.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"As a working process developed by the SCRC, the data pipeline can be understood by considering the central kernel of its technological implementation: the Data Registry (DR). Essentially it consists of a relational database, and a RESTful API for reading and writing to the database.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The database schema (as illustrated below) is detailed, but key entity types of relevance here include:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Data Products - metadata, or information about data 'products'. To elaborate: a data product typically includes a link to, e.g. a table of scientific data, but [for the most part] the underlying data is not actually stored in the DR. This may appear at first glance to be a limitation but there is a key benefit to the approach which is discussed briefly in due course.\nCode Repo Releases - i.e. 'models', or a given version of some code that implements, e.g. a statistical model.\nCode runs - or model runs, such as the output from a single realisation of the model.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Thus, the Code Repo (and Release) relating to a given statistical model, may be associated with a number of Code Runs, which in turn may be associated with a number of Data Products (as 'inputs' and 'outputs'.)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"In summary the data pipeline provides both a centralised repository for [meta]data, and a means of tracking the full history of COVID-related modelling outputs, including data and other inputs, such as the random seed used to generate a particular realisation of a given model.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"The resulting 'audit trail' can thus provide transparency, and greatly improve the reproducibility, of published scientific research, even where the models and data used to produce them are complex or sophisticated.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Note that as a working process the pipeline is somewhat cyclical in nature: model outputs can be used to provide inputs for other models, and so on. Thus the audit capabilities of the pipeline process are not limited to individual research projects, models or datasets - it naturally extends to a sequence of ongoing projects, possibly produced by different users and teams ('groups' in the DR.)","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"In other words, it mirrors the way in which scientific research in general is published, whilst providing a robust solution to vitally important current challenges far beyond the fields of public health and epidemiology, such as reproducibility and transparency.","category":"page"},{"location":"#The-SCRC-Data-Registry","page":"Introduction","title":"The SCRC Data Registry","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"As with the pipeline itself, a key design strength of the Data Registry (DR) is its 'agnosticism'. That is, it is agnostic with respect to both programming languages and [the format of] datasets. Thus, it is compatible even with those that have not been invented yet.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Whilst this is a key strength, it does impose certain constraints on the functionality that can be provided directly within the framework of the DR itself. For example, in order to provide features such as file processing (necessary for the automated import of Data Products from the DR) it is necessary to know the file format in advance. This is also true of data processing in general: in order to do any kind of meaningful data processing, we must know both the structure of a given type of dataset, and how to recognise it in practice.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"For that reason, features such as these are instead provided by what can be regarded as an 'automation layer', a set of utility-like software packages (such as this one) and tools that comprise an important layer of the pipline's software ecosystem, because they make it possible for model developers to download data, and otherwise meaningfully interact with the SCRC pipeline process using only a few lines of code.","category":"page"},{"location":"#Data-Registry-schema","page":"Introduction","title":"Data Registry schema","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"<img src=\"https://data.scrc.uk/static/images/schema.svg\" alt=\"SCRC Data Registry schema=\"height: 80px;\"/>","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Hint: click here to expand the image.","category":"page"},{"location":"#What-does-this-package-do?","page":"Introduction","title":"What does this package do?","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Similar to the SCRCData package for R and the datapipelineapi package for Python, this package provides a language-specific automation layer [for the language-agnostic RESTful API that is used to interact with the DR.] It also handles the downloading (and pre-processing) of Data Products based on that [meta]data.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Key features include:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Convenient Data Products downloads, specified by a given 'data config' .yaml file.\nFile hash-based version checking: new data is downloaded only when necessary.\nA SQLite layer for convenient pre-processing (typically aggregation, and the joining of disparate datasets based on common identifiers.)\nEasily register model code or realisations with a single line of code.","category":"page"},{"location":"#SQLite-layer","page":"Introduction","title":"SQLite layer","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"The SQLite layer is optional - the data can also be returned as a set of nested Dictionaries. However it is the recommended way of using the package since it provides for convenient pre-processing and as well as certain planned features of the package. See the SQLite.jl docs for more information about that package, and the Simple example and Code snippets page for practical usage examples pertinent to this one.","category":"page"},{"location":"#Package-installation","page":"Introduction","title":"Package installation","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"The package is not currently registered and must be added via the package manager Pkg. From the REPL type ] to enter Pkg mode and run:","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"pkg> add https://github.com/ScottishCovidResponse/DataRegistryUtils.jl","category":"page"},{"location":"#Further-development-work","page":"Introduction","title":"Further development work","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"There is ongoing development work to do, subject to feedback from users. In particular:","category":"page"},{"location":"#Registering-data-products","page":"Introduction","title":"Registering data products","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"The registration of Data Products, including but not limited to model outputs, in the DR is a WIP.","category":"page"},{"location":"#SQL-based-access-logs-(a-component-of-Code-Run-objects)","page":"Introduction","title":"SQL-based access logs (a component of Code Run objects)","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Existing functionality for recording data usage in model runs is based on the individual data products specified in the data configuration .yaml file. However since data products may include multiple components, it would be better to have a more precise record of the data that is actually utilised. This functionality is currently being implemented via the aforementioned SQLite layer.","category":"page"},{"location":"","page":"Introduction","title":"Introduction","text":"Features in consideration include optional 'tags' specified by the user at the point of [data] access - passed as a parameter to a given function call. It is anticipated that these tags could be used to record information such as the calling Julia Module / line of code; key filters and aggregation levels used to process the data; or even references to downstream outputs, e.g. 'Page x, Table y in Report z.'","category":"page"},{"location":"#Suggestions-welcome!","page":"Introduction","title":"Suggestions welcome!","text":"","category":"section"},{"location":"","page":"Introduction","title":"Introduction","text":"Feel free to reach out: martin.burke@bioss.ac.uk","category":"page"}]
}
