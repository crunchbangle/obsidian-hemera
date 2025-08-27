import { setIcon, App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
import { Moment } from 'moment'
let moment = require('moment');

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	mySetting: string;
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	mySetting: 'default'
}

export default class HemeraPlugin extends Plugin {
	settings: MyPluginSettings;

	async onload() {
		
		await this.loadSettings();

		// This creates an icon in the left ribbon.
		const ribbonIconEl = this.addRibbonIcon('dice', 'Sample Plugin', async (evt: MouseEvent) => {

			console.log('where does this end up???')

			// Called when the user clicks the icon.
			new Notice('This is a notice!');

			// can do stuff here??

			await this.makeToday()

		});
		// Perform additional things with the ribbon
		ribbonIconEl.addClass('my-plugin-ribbon-class');

		// This adds a simple command that can be triggered anywhere
		this.addCommand({
			id: 'open-sample-modal-simple',
			name: 'Open sample modal (simple)',
			callback: () => {
				new SampleModal(this.app).open();
			}
		});
		// This adds an editor command that can perform some operation on the current editor instance
		this.addCommand({
			id: 'sample-editor-command',
			name: 'Sample editor command',
			editorCallback: (editor: Editor, view: MarkdownView) => {
				console.log(editor.getSelection());
				editor.replaceSelection('Sample Editor Command');
			}
		});

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));

		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	}

	onunload() {

	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	makeToday = async () => {
		const files = this.app.vault.getMarkdownFiles()
		const path = this.getDayPath(moment());
		const today_string = this.getDayString(moment()); // make a fresh moment, cos it gets modified!
		const yesterdayFile = this.findYesterday();
		if(yesterdayFile === undefined){
			new Notice('No yesterday found!');
			return;
		}

		const yesterday = await this.app.vault.read(yesterdayFile!);
		const todos = this.extractTodos(yesterday);

		console.log(todos)


		// https://docs.obsidian.md/Plugins/Vault
	}

	extractTodos = (text: string) => {
		// do this...
		const lines = text.split("\n");
		const done = lines.filter(x => x.contains('- [x]'));
		const todo = lines.filter(x => x.contains('- [ ]'));
		for(let i=0; i<lines.length; i++){
			if(! lines[i].startsWith('> [!todo]')) continue;
			let s = '';
			while(lines[i].startsWith('>')){
				s += lines[i]+"\n";
				i++;
			}
			todo.push(s);
		}
		return {todo, done};
	}

	findYesterday = () => {
		const maxDaysInPastToLook = 60;
		let daysInPastLooked = 0;
		const files = this.app.vault.getMarkdownFiles();
		const paths = files.map(f => f.path)
		let m: Moment = moment().subtract(1, 'day');
		let path = this.getDayPath(m); // Journal/2025/Q3/Week35-wc-Aug25/08.25.MO.md
		while(!paths.contains(path)){
			m.subtract(1, 'day');
			path = this.getDayPath(m);
			daysInPastLooked++;
			if(daysInPastLooked > maxDaysInPastToLook){
				return;
			}
		}
		return files.filter(x => x.path == path)[0];
	}

	getDayPath = (m: Moment) => {		
		const yyyy = m.format('YYYY'); // year
		const ww = m.format('WW'); // ISO week of year, two-digit format (eg 04)
		const e = parseInt(m.format('E')); // ISO day of week, 1=Mon, 7=Sun
		const q = m.format('Q'); // quarter, 1-4 as a digit
		const today_string = this.getDayString(m); // for filename and title
		const mondate = m.subtract(e-1, 'day').format('MMMDD'); // monday of this week
		const path = `Journal/${yyyy}/Q${q}/Week${ww}-wc-${mondate}/${today_string}.md`
		return path;
	}

	getDayString = (m: Moment) => {		
		const dd = m.format('DD'); // date, two-digit format (eg 09)
		const mm = m.format('MM'); // month, two-digit format (eg 09)
		const ddd = m.format('ddd'); // day name
		const day_name = ddd.substring(0,2).toUpperCase(); // first two letters, uc
		const today_string = `${mm}.${dd}.${day_name}`; // for filename and title
		return today_string;
	}
}

class SampleModal extends Modal {
	constructor(app: App) {
		super(app);
	}

	onOpen() {
		const {contentEl} = this;
		contentEl.setText('Woah!');
	}

	onClose() {
		const {contentEl} = this;
		contentEl.empty();
	}
}

class SampleSettingTab extends PluginSettingTab {
	plugin: HemeraPlugin;

	constructor(app: App, plugin: HemeraPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Setting #1')
			.setDesc('It\'s a secret')
			.addText(text => text
				.setPlaceholder('Enter your secret')
				.setValue(this.plugin.settings.mySetting)
				.onChange(async (value) => {
					this.plugin.settings.mySetting = value;
					await this.plugin.saveSettings();
				}));
	}
}
