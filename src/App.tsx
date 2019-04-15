import * as React from 'react';
import { Dropdown } from 'office-ui-fabric-react/lib/Dropdown';
import { PrimaryButton } from 'office-ui-fabric-react/lib/Button';
import { TextField } from 'office-ui-fabric-react/lib/TextField';
import './components/styles.css';

export interface IApp {
	sourceIMG: any;
	selectedItem: any;
	val: any;
}

class App extends React.Component<{},IApp> {
	private source = React.createRef() as any;
	private canvas = React.createRef() as any;
	private dropdownRef = React.createRef() as any;
	constructor(props) {
		super(props);

		this.state = {
			sourceIMG: null,
			selectedItem: null,
			val: ''
		};

		this.fileChange = this.fileChange.bind(this);
		this.applyFilter = this.applyFilter.bind(this);
		this._onChange = this._onChange.bind(this);
		this.updateCanvas = this.updateCanvas.bind(this);
		this.onChangeVal = this.onChangeVal.bind(this);
	}

	private fileChange(ev) {
		const target: any = event.target;

		const fr = new FileReader();
		fr.onload = () => {
			this.source.src = fr.result;

			const img: any = new Image;
			img.onload = () => {
				this.canvas.width = img.width;
				this.canvas.height = img.height;
				this.canvas.getContext('2d').drawImage(img, 0, 0);
				this.setState({
					sourceIMG: img
				});
			};
			img.src = fr.result;
		};
		fr.readAsDataURL(target.files[0]);
	}

	private updateCanvas() {
		this.canvas.width = this.state.sourceIMG.width;
		this.canvas.height = this.state.sourceIMG.height;
		this.canvas.getContext('2d').drawImage(this.state.sourceIMG, 0, 0);
	}

	private add(data, constant) {
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = data[i] + constant;
			data[i+1] = data[i+1] + constant;
			data[i+2] = data[i+2] + constant;
		}
	}

	private neg(data) {
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = data[i] ^ 255;
			data[i+1] = data[i+1] ^ 255;
			data[i+2] = data[i+2] ^ 255;
		}
	}

	private mul(data, constant) {
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = data[i] * constant;
			data[i+1] = data[i+1] * constant;
			data[i+2] = data[i+2] * constant;
		}
	}

	private pow(data, constant) {
		const max = Math.max(data);
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = 255 * Math.pow(data[i] / max, constant);
			data[i+1] = 255 * Math.pow(data[i+1] / max, constant);
			data[i+2] = 255 * Math.pow(data[i+2] / max, constant);
		}
	}

	private log(data) {
		const max = Math.max(data);
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = 255 * Math.log2(1 + data[i]) / Math.log2(1 + max);
			data[i+1] = 255 * Math.log2(1 + data[i+1]) / Math.log2(1 + max);
			data[i+2] = 255 * Math.log2(1 + data[i+2]) / Math.log2(1 + max);
		}
	}

	private applyFilter() {
		this.updateCanvas();
		const context = this.canvas.getContext('2d');
		let imageData = context.getImageData(0, 0, this.canvas.width, this.canvas.height);

		switch(this.state.selectedItem.key) {
			case 'Add':
				this.add(imageData.data, parseFloat(this.state.val));
				break;
			case 'Negative':
				this.neg(imageData.data);
				break;
			case 'Mul':
				this.mul(imageData.data, parseFloat(this.state.val));
				break;
			case 'Pow':
				this.pow(imageData.data, parseFloat(this.state.val));
				break;
			case 'Log':
				this.log(imageData.data);
				break;
			default:
				break;
		}
		
		context.putImageData(imageData, 0, 0);
	}

	private _onChange(ev, option) {
		this.setState({
			selectedItem: option
		});
	}

	private onChangeVal(ev) {
		this.setState({
			val: ev.target.value
		});
	}

	public render() {
		return (
			<div>
				<div className="inputContainer">
					<input onChange={this.fileChange} type="file" id="files" name="files[]" multiple />
				</div>
				<div className="flex">
					<img ref={(ref) => this.source = ref} />
					<canvas ref={(ref) => this.canvas = ref}></canvas>
				</div>
				<div className="buttonsContainer">
				<Dropdown
					componentRef={this.dropdownRef}
					placeholder="Select an option"
					label="Required dropdown example"
					options={[
						{ key: 'Add', text: 'Add' },
						{ key: 'Negative', text: 'Negative' },
						{ key: 'Mul', text: 'Mul' },
						{ key: 'Pow', text: 'Pow' },
						{ key: 'Log', text: 'Log' }
					]}
					required={true}
					onChange={this._onChange}
					selectedKeys={this.state.selectedItem}
					styles={{ dropdown: { width: 300 } }}
				/>
				<TextField label="Standard" value={this.state.val} onChange={this.onChangeVal} />
				<PrimaryButton text="Apply" onClick={this.applyFilter} />
				</div>
			</div>
		);
	}
}

export default App;

