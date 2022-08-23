function createInput (id, type, name, value, checked)
{
    const inputElement = document.createElement("input");
    inputElement.id = id;
    inputElement.type = type;
    inputElement.name = name;
    inputElement.value = value;
    if(checked) inputElement.checked = true;

    return inputElement;
}

function noSpaces (text)
{
    return text.replace(/[ ]/g, '-');
}

function createID (text)
{
	return text.toLowerCase().replace(/[ ]/g, '-');
}

/**
 * input types :
 * - choice : multipla - escolha
 * - rangeint  : numero inteiro entre minimo e maximo
 */

class FormObject extends HTMLElement 
{
	static #totalForms = 0;
	static get totalForms () {return FormObject.#totalForms;}

    /**
     * @type {string}
     */
    #src;

	/**
	 * @type {string}
	 */
	#id;

    /**
     * @type {HTML#formElement}
     */
    #formElement;

    /**
     * @type {HTMLButtonElement}
     */
    #nextButton;
	/**
     * @type {HTMLButtonElement}
     */
	#backButton;
	/**
     * @type {HTMLButtonElement}
     */
	#submitButton;

    /**
     * @type {HTMLElement}
     */
    #titleElement;

	#sectionContainer;
    /**
     * @type {any}
     */
    #sectionElements;

    /**
     * @type {string}
     */
    currentSection;

    constructor ()
    {
        super();
        this.#formElement = document.createElement("form");
        this.#titleElement = document.createElement("h2");
        this.#formElement.appendChild(this.#titleElement);

		this.#sectionContainer = document.createElement("div");
		this.#formElement.appendChild(this.#sectionContainer);
		
		const buttonsContainer = document.createElement("span");

		this.#backButton = document.createElement("button");
		this.#backButton.type = "button";
        this.#backButton.onclick = (e) => this.backForm (e);
		this.#backButton.disabled = true;
		buttonsContainer.appendChild(this.#backButton);

		this.#nextButton = document.createElement("button");
        this.#nextButton.type = "button";
        this.#nextButton.onclick = (e) => this.nextForm (e);
		this.#nextButton.disabled = true;
		buttonsContainer.appendChild(this.#nextButton);

		this.#submitButton = document.createElement("button");
        this.#submitButton.type = "button";
        this.#submitButton.onclick = (e) => this.sendForms (e);
		this.#submitButton.hidden = true;
		buttonsContainer.appendChild(this.#submitButton);

		this.#formElement.appendChild(buttonsContainer);

        this.currentSection = "";
		this.#sectionElements = {};
        if(this.hasAttribute("src"))
        {
            this.src = this.getAttribute("src");
        }
    }

    set src (_src)
    {
        this.#src = _src;
        this.loadSrc ();
    }

    get src ()
    {
        return this.#src;
    }

    async loadSrc ()
    {
        const data = await fetch(this.#src).then(resp => resp.json());
        this.build (data);
    }

    build (data)
    {
		this.#id = `form-${FormObject.#totalForms++}`;
		this.#formElement.id = this.#id;
        this.#formElement.appendChild(this.createStyle());
        this.#titleElement = data.title;

        data.sections.forEach((section, i) => 
        {
			const sectionElement = this.createSection(section);
			if(i == 0) 
			{
				this.currentSection = section.id;
				this.#sectionContainer.append(sectionElement);
			}
        });

		this.#nextButton.innerText = data.next;
		this.#backButton.innerText = data.back;
        this.#submitButton.innerText = data.submit;
        this.appendChild(this.#formElement);
    }

    createStyle ()
    {
        const styleElement = document.createElement("style");
		//styleElement.type = 'text/css';
        styleElement.innerHTML = `
			form {}
			form > div {

			}
			form > span {
				display:flex;
				flex-grow:1;
				justify-content:space-between;
				margin: 2px
			}
			form-section {
				display:flex;
				flex-grow:1;
			}
			fieldset {
				display:flex;
				flex-grow:1;
				height:fit-content;
				width:fit-content;
			}
			fieldset > ul {
				display:flex;
				flex-grow:1;
				flex-direction:column;
				justify-content:space-between;
				padding:0;
				margin:0;
				list-style:none;
			}
			form-choices {
				display:flex;
				flex-grow:1;
				flex-direction:column;
				margin:15px;
			}
			form-choices > ul { 
				display:flex;
				flex-grow:1;
				flex-direction:column;
				justify-content:space-between;
				margin:10px;
				padding:0;
				list-style:none;
				user-select:none;
			}
			form-choices > ul > li { 
				display:flex;
				flex-grow:1;
				justify-content:space-between;
				align-items:center;
				padding:1px;
			}
			form-choices > ul > li > label {
				display:flex; flex-grow:1; cursor:pointer;
				padding:5px;
				padding-right:10px;
			}
			form-choices > ul > li > input[type="radio"] {
				cursor:pointer;
				margin: 0;
				padding: 5px;
				height: 1.6em;
				width: 1.6em;
			}
        `.replace(/\s/g,'');//.replace(/(^\t{3})|(^\n{1})/gm, '');
        return styleElement;
    }

    createSection (section)
    {
        const formSection = document.createElement("form-section");
		formSection.id = `${this.#id}-${section.id}`;
		formSection.formObject = this;
        formSection.data = section;
		formSection.onchange = (e) => 
		{
			const r = JSON.parse(e.target.value);
			//console.log(section.id, r);
			const next = section.next;
			if(next && next.length > 0)
			{
				const nextSection = next.find(nextSection => 
				{
					const conditions = nextSection.conditions;
					
					if(conditions && conditions.length > 0)
					{
						const h = conditions.some(condition => 
						{
							if(condition && condition.length > 0)
							{
								const c = condition.reduce((q, con) => 
								{
									const v = r[con.id];
									q = v == con.value;
									return q;
								}, true);
								if(c) return condition;
							}
						});
						if(h) return nextSection;
					}
					else return nextSection;
				});
				console.log(r, nextSection?.id);
				if(nextSection)
				{
					if(!nextSection.id)
					{
						this.#nextButton.hidden = true;
						this.#submitButton.hidden = false;
					}
					else
					{
						this.#nextButton.disabled = false;
						this.#nextButton.hidden = false;
						this.#submitButton.hidden = true;
					}
				}
			}
			
		};
		this.#sectionElements[formSection.id] = formSection;
        return formSection;
    }

	nextForm (e)
	{

	}

	backForm (e)
	{

	}

    sendForms (e)
    {
        const formData = new FormData(this.#formElement);
        console.log("Send forms", formData);
    }
}
customElements.define("form-object", FormObject);

class FormSection extends HTMLElement
{
	/**
	 * @type {FormObject}
	 */
	#formObject;
	#inputs;
	#name;
	nextSection;
	backSection;
	#value;

	constructor ()
	{
		super();
		this.#inputs = {};
	}

	/**
	 * @param {FormObject} parentForm
	 */
	set formObject (parentForm)
	{
		this.#formObject = parentForm;
	}

	/**
	 * @param {{ name: string; inputs: any[]; id: string }} sectionData
	 */
	set data (sectionData)
	{
		const sectionElement = document.createElement("fieldset");
		this.#name = sectionData.id;
        const sectionLegendElement = document.createElement("legend");
        sectionLegendElement.innerText = sectionData.name;
        sectionElement.appendChild(sectionLegendElement);

		const inputListElement = document.createElement("ul");
        sectionData.inputs.forEach(input => 
        {
            inputListElement.appendChild(this.createInput(input));
        });
		sectionElement.appendChild(inputListElement);
		this.appendChild(sectionElement);
	}

	createInput (input)
    {
        const inputContainer = document.createElement("li");

        if(customElements.get(`form-${input.type}`))
		{
			const inputElement = document.createElement(`form-${input.type}`);
			inputElement.id = `${this.id}-${input.id}`;
			inputElement.formSection = this;
			inputElement.build(input.id, input.values, input.name);
			//const id = `${this.#name}-${input.id}`;
			inputElement.onchange = (e) => 
			{
				this.setValue(input.id, e.target.value);
				
				if ("createEvent" in document) {
					var evt = document.createEvent("HTMLEvents");
					evt.initEvent("change", false, true);
					this.dispatchEvent(evt);
				} else this.fireEvent("onchange");
			}
			inputContainer.appendChild(inputElement);
		}

		return inputContainer;
    }

	setValue (id, value)
	{
		if(!value)
		{
			delete this.#inputs[id];
		}
		else
		{
			this.#inputs[id] = value;
		}
		
		const entries = Object.entries(this.#inputs).map(t => `"${t[0]}":"${t[1]}"`).join(",");
		this.value = `{${entries}}`;
	}

	set value (value)
	{
		this.#value = value;
	}

	get value () 
	{
		return this.#value;
	}
}
customElements.define("form-section", FormSection);

class FormChoices extends HTMLElement 
{
	/**
	 * @type {FormSection}
	 */
	#formSection;
	#options;
	/**
	 * @type {string}
	 */
	#value;
	//onchange;

	constructor ()
	{
		super();
		this.#options = {};
		let name, values, title;
		if(this.hasAttribute("name"))
		{
			name = this.getAttribute("name");
		}
		if(this.hasAttribute("title"))
		{
			title = this.getAttribute("title");
		}
		//this.onload = ()=>{this.build(name, values, title)};
	}

	/**
	 * @param {FormSection} parentSection
	 */
	set formSection (parentSection)
	{
		this.#formSection = parentSection;
		parentSection.appendChild(this);
	}

	/**
	 * 
	 * @param {string} name 
	 * @param {{name:string, value:string | number}[]} value 
	 * @param {*} title 
	 */
	build (name, values, title)
	{
		if(title)
		{
			const titleElement = document.createElement("span");
			titleElement.innerText = title;
			this.appendChild(titleElement);
		}

		const optionsElement = document.createElement("ul");

		if(values)
		{
			values.forEach((option) => 
			{
				const id = `${this.id}-${createID(`${option.value}`)}`;
				const optionElement = document.createElement("li");
				optionElement.id = id;
				const optionLabelElement = document.createElement("label");
				optionLabelElement.htmlFor = `${id}.input`;
				optionLabelElement.innerText = option.name;
				const optionInputElement = createInput(optionLabelElement.htmlFor, "radio", name, option.value);
				optionInputElement.required = true;
				optionElement.appendChild(optionLabelElement);
				optionElement.appendChild(optionInputElement);
				optionsElement.appendChild(optionElement);
				this.#options[option.value] = optionInputElement;
				optionInputElement.onchange = (e) => 
				{
					e.stopPropagation();
					const newValue = e.target.value;
					this.#value = newValue;

					if ("createEvent" in document) {
						var evt = document.createEvent("HTMLEvents");
						evt.initEvent("change", false, true);
						this.dispatchEvent(evt);
					}
					else
						this.fireEvent("onchange");
					//if(this.onchange) this.onchange(e);
					
				};
			});
		}

		this.appendChild(optionsElement);
	}

	/**
	 * @param {string} _value
	 */
	set value (_value)
	{
		if(this.#value) this.#options[this.#value].checked = false;
		this.#value = v;
		if(this.#value) this.#options[this.#value].checked = true;
	}

	get value ()
	{
		return this.#value;
	}
}
customElements.define("form-choices", FormChoices);

class FormRangeInt extends HTMLElement 
{
	constructor ()
	{
		super();
	}

	/* createRangeInt (parent, input)
    {
		const inputLabelElement = document.createElement("label");
		inputLabelElement.htmlFor = `${parent.id}.input`;
		inputLabelElement.innerText = input.name;
		const inputRangeElement = createInput(inputLabelElement.htmlFor, "range", input.id, (input.values.min + input.values.max)/2);
		inputRangeElement.min = input.values.min;
		inputRangeElement.max = input.values.max;
		parent.appendChild(inputLabelElement);
		parent.appendChild(inputRangeElement);
    } */
}
customElements.define("form-rangeint", FormRangeInt);