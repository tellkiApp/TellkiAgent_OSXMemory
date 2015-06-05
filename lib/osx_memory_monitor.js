/**
* This script was developed by Guberni and is part of Tellki's Monitoring Solution
*
* May, 2015
* 
* Version 1.0
*
* DESCRIPTION: Monitor OSX Memory
*
* SYNTAX: node osx_memory_monitor.js <METRIC_STATE>
* 
* EXAMPLE: node osx_memory_monitor.js "1,1,1,1,1,1"
*
* README:
*		<METRIC_STATE> is generated internally by Tellki and it's only used by Tellki default monitors.
*		1 - metric is on ; 0 - metric is off
**/

// METRICS IDS

var metrics = [];
metrics["phys_mem_usage"] =  { id:"82:% Used Physical Memory:6", value:0, retrieveMetric: 1 };
metrics["phys_mem_used"] =   { id:"2009:Used Physical Memory:4", value:0, retrieveMetric: 1 };
metrics["phys_mem_free"] =   { id:"66:Free Physical Memory:4", value:0, retrieveMetric: 1 };
metrics["swap_mem_usage"] =  { id:"16:% Used Swap:6", value:0, retrieveMetric: 1 };
metrics["swap_mem_used"] =   { id:"15:Used Swap:4", value:0, retrieveMetric: 1 };
metrics["swap_mem_free"] =   { id:"47:Free Swap:4", value:0, retrieveMetric: 1 };

// ############# INPUT ###################################

//START
(function() {
	try
	{
		monitorInputProcess(process.argv.slice(2));
	}
	catch(err)
	{	
		console.log(err.message);
		process.exit(1);
		
	}
}).call(this)

/**
 * Process the passed arguments and send them to monitor execution
 * Receive: arguments to be processed
 */
function monitorInputProcess(args)
{
	if (args[0] != undefined)
	{

		//<METRIC_STATE>
		var metricState = args[0].replace("\"", "");
		var tokens = metricState.split(",");

		if (tokens.length != Object.keys(metrics).length)
			throw new Error("Invalid number of metric state");

		var i = 0;
		for (var key in metrics) 
		{
			if (metrics.hasOwnProperty(key)) 
			{
				metrics[key].retrieveMetric = parseInt(tokens[i]);
				i++;
			}
		}
	}

	monitor();
}

// PROCESS

/**
 * Retrieve metrics information
 */
function monitor()
{
	var process = require('child_process');
		 
	var ls = process.exec('sysctl vm.swapusage', function (error, stdout, stderr) 
	{
		if (error)
			errorHandler(new UnableToGetMetricsError());

		parseSwapMem(stdout);
	   
	});
	
	ls.on('exit', function (code) 
	{
		if(code != 0)
	   		errorHandler(new UnableToGetMetricsError());
	});
}


/*
* Parse swap result from process output
* Receive: string containing results
*/
function parseSwapMem(result)
{

	var totalSwap = 0;

	var values = result.match(/\d+\.\d+\w/g);

	for(var i in values)
	{
		var cleanValue = values[i].match(/\d+\.\d+/g)[0];

		if(values[i].indexOf('G') > -1)
		{
			cleanValue = cleanValue * 1024; //convert to MB
		}


		if(i == 0)
		{
			totalSwap = cleanValue;
		}
		else if(i == 1)
		{
			metrics["swap_mem_used"].value = cleanValue;

			metrics["swap_mem_usage"].value = (100 * cleanValue / totalSwap).toFixed(2);
			
		}
		else if(i == 2)
		{
			metrics["swap_mem_free"].value = cleanValue;
		}

	}

	calcPhysicalMem();

}

/*
* Get physical memory stats
*/
function calcPhysicalMem()
{
	var os = require('os');

	var totalm = (os.totalmem() / 1024 / 1024).toFixed(2);
	var freem = (os.freemem() / 1024 / 1024).toFixed(2) ;
	var usedm = (totalm - freem);


	metrics["phys_mem_used"].value = usedm;
	metrics["phys_mem_free"].value = freem;
	metrics["phys_mem_usage"].value = (100*usedm/totalm).toFixed(2);


	output();
}



//################### OUTPUT METRICS ###########################

/*
* Send metrics to console
*/
function output()
{
	
	for (var key in metrics) 
	{
		if (metrics.hasOwnProperty(key)) 
		{

			if(metrics[key].retrieveMetric === 1)
			{
				var out = "";
				
				out += metrics[key].id + "|";
				out += metrics[key].value;
				out += "|";
				
				console.log(out);
			}

	    	
		}
	}
}

//################### ERROR HANDLER #########################
/*
* Used to handle errors of async functions
* Receive: Error/Exception
*/
function errorHandler(err)
{
	if(err instanceof UnableToGetMetricsError)
	{
		console.log(err.message);
		process.exit(err.code);
	}
	else
	{
		console.log(err.message);
		process.exit(1);
	}
}


//####################### EXCEPTIONS ################################

//All exceptions used in script

function InvalidParametersNumberError() {
    this.name = "InvalidParametersNumberError";
    this.message = ("Wrong number of parameters.");
	this.code = 3;
}
InvalidParametersNumberError.prototype = Object.create(Error.prototype);
InvalidParametersNumberError.prototype.constructor = InvalidParametersNumberError;


function UnableToGetMetricsError() {
    this.name = "UnableToGetMetricsError";
    this.message = ("Unable to get cpu metrics");
	this.code = 30;
}
UnableToGetMetricsError.prototype = Object.create(Error.prototype);
UnableToGetMetricsError.prototype.constructor = UnableToGetMetricsError;




