
const EXIT_CODE_RESTART = 45;
const process_modules = require('child_process');
var bot_primary;
var musicbotInstance;
const enable_musicbot = 0;

startBot();

async function startBot(){
	launch();
}

async function launch(){
	bot_primary = process_modules.spawn('cmd.exe', ['/C', 'node bot_main.js']);
	console.log('Launching Bot Process.');
	bot_primary.on('exit', (code) => {
		console.log('Bot exited with code ' + code);
		if(code == EXIT_CODE_RESTART){
			console.log('RESTARTING BOT.');
			launch();
		}
		else{
			console.log('SHUTTING DOWN.');
			process.exit();
		}
	});
	bot_primary.stdout.on('data', (data) => {
	  console.log(data.toString());
	});
	musicBot();	//Forces musicbot relaunch if needed.
}

async function musicBot(){
	if(enable_musicbot == 0){
		return
	}
	if(musicbotInstance){
		return
	}
	musicbotInstance = process_modules.spawn('cmd.exe', ['/C', 'cd python_musicbot && python run.py']);
	console.log('Launching Python Musicbot.');
	musicbotInstance.on('exit', (code) => {
		console.log('Music Bot exited with code ' + code);
		musicbotInstance = null;
	});
	musicbotInstance.stdout.on('data', (data) => {
	  console.log('Music Bot: ' + data.toString());
	});

}