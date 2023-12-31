import {Menu, Notice, Editor, moment, addIcon, Plugin, setIcon, WorkspaceLeaf} from "obsidian";
import {ExampleModal, ExampleSuggestModal} from "./modals";
import {ExampleSettingTab} from "./settings";
import {ExampleView, VIEW_TYPE_EXAMPLE} from "./view";

// The settings definition and default settings
//
interface ExamplePluginSettings {
	dateFormat: string;
}

const DEFAULT_SETTINGS: Partial<ExamplePluginSettings> = {
	dateFormat: "YYYY-MM-DD",
};

export default class ExamplePlugin extends Plugin {
	statusBarTextElement: HTMLSpanElement;
	settings: ExamplePluginSettings;

	async onload() {

		this.addRibbonIcon("dice", "Print leaf types", () => {
			this.app.workspace.iterateAllLeaves((leaf) => {
				console.log(leaf.getViewState().type);
			});
		});

		this.registerView(
			VIEW_TYPE_EXAMPLE,
			(leaf) => new ExampleView(leaf)
		);

		this.addRibbonIcon("star", "Activate view", () => {
			this.activateView();
		});

		// Add the Settings Tab
		//
		await this.loadSettings();
		this.addSettingTab(new ExampleSettingTab(this.app, this));

		// Add a line count to the status bar
		//
		this.statusBarTextElement = this.addStatusBarItem().createEl('span')
		await this.readActiveFileAndUpdateLineCount();

		this.app.workspace.on("active-leaf-change", async () => {
			await this.readActiveFileAndUpdateLineCount();
		})

		this.app.workspace.on('editor-change', editor => {
			const content = editor.getDoc().getValue();
			this.updateLineCount(content);
		})

		// Add a left ribbon icon and command
		//
		this.addRibbonIcon("dollar-sign", "Print to console", () => {
			console.log("Activating Sports Book");
		});

		// Add an icon and two spans to the status bar
		//
		const fruits = this.addStatusBarItem();
		setIcon(fruits, "info");
		fruits.createEl("span", {text: "🍎"});
		fruits.createEl("span", {text: "🍌"});

		const veggies = this.addStatusBarItem();
		veggies.createEl("span", {text: "🥦"});
		veggies.createEl("span", {text: "🥬"});

		// Insert text into the current editor
		//
		this.addCommand({
			id: "insert-today's-date",
			name: "Insert today's date",
			editorCallback: (editor: Editor) => {
				editor.replaceRange(
					moment().format("YYYY-MM-DD"),
					editor.getCursor()
				);
			},
		});

		// Replace the selection in the current editor
		//
		this.addCommand({
			id: "convert-to-uppercase",
			name: "Convert to uppercase",
			editorCallback: (editor: Editor) => {
				const selection = editor.getSelection();
				editor.replaceSelection(selection.toUpperCase());
			},
		});

		// Context Menus
		//
		this.addRibbonIcon("dice", "Open menu", (event) => {
			const menu = new Menu();

			menu.addItem((item) =>
				item
					.setTitle("Copy")
					.setIcon("documents")
					.onClick(() => {
						new Notice("Copied");
					})
			);

			menu.addItem((item) =>
				item
					.setTitle("Paste")
					.setIcon("paste")
					.onClick(() => {
						new Notice("Pasted");
					})
			);

			menu.showAtMouseEvent(event);
		});

		// Add an icon to the ribbon
		addIcon("circle", `<circle cx="50" cy="50" r="50" fill="currentColor" />`);
		this.addRibbonIcon("circle", "Click me", () => {
			console.log(`The settings were ${this.settings.dateFormat}`);
		});

		// Fun with modals.
		//
		// this.addCommand({
		// 	id: "display-modal",
		// 	name: "Display modal",
		// 	callback: () => {
		// 		new ExampleModal(this.app).open();
		// 	},
		// });

		this.addCommand({
			id: "display-modal",
			name: "Display modal",
			callback: () => {
				new ExampleModal(this.app, (result) => {
					new Notice(`Hello, ${result}!`);
				}).open();
			},
		});

		this.addCommand({
			id: "suggest-modal",
			name: "Suggest modal",
			callback: () => {
				new ExampleSuggestModal(this.app).open();
			},
		});
	}

	async activateView() {
		let {workspace} = this.app;

		let leaf: WorkspaceLeaf | null = null;
		let leaves = workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE);

		if (leaves.length > 0) {
			// A leaf with our view already exists, use that
			leaf = leaves[0];
		} else {
			// Our view could not be found in the workspace, create a new leaf
			// in the right sidebar for it
			let leaf = workspace.getRightLeaf(false);
			await leaf.setViewState({type: VIEW_TYPE_EXAMPLE, active: true});
		}

		// TODO: There is a type problem when this lin is uncommented. Need to fix this.
		// "Reveal" the leaf in case it is in a collapsed sidebar
		//workspace.revealLeaf(leaf);
	}

	// Helper methods for the setting code
	//
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	private async readActiveFileAndUpdateLineCount() {
		const file = this.app.workspace.getActiveFile()
		if (file) {
			const content = await this.app.vault.read(file);
			this.updateLineCount(content);
		} else {
			this.updateLineCount(undefined);
		}
	}

	private updateLineCount(fileContent?: string) {
		const count = fileContent ? fileContent.split(/\r\r|\r|\n/).length : 0;
		const linesWord = count === 1 ? "line" : "lines";
		this.statusBarTextElement.textContent = `${count} ${linesWord}`;
	}
}
