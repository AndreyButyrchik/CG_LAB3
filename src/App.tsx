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

	private HSVtoRGB(h, s, v) {
		var r, g, b, i, f, p, q, t;
		if (arguments.length === 1) {
			s = h.s, v = h.v, h = h.h;
		}
		i = Math.floor(h * 6);
		f = h * 6 - i;
		p = v * (1 - s);
		q = v * (1 - f * s);
		t = v * (1 - (1 - f) * s);
		switch (i % 6) {
			case 0: r = v, g = t, b = p; break;
			case 1: r = q, g = v, b = p; break;
			case 2: r = p, g = v, b = t; break;
			case 3: r = p, g = q, b = v; break;
			case 4: r = t, g = p, b = v; break;
			case 5: r = v, g = p, b = q; break;
		}
		return {
			r: Math.round(r * 255),
			g: Math.round(g * 255),
			b: Math.round(b * 255)
		};
	}

	private RGBtoHSV(r, g, b) {
		if (arguments.length === 1) {
			g = r.g, b = r.b, r = r.r;
		}
		var max = Math.max(r, g, b), min = Math.min(r, g, b),
			d = max - min,
			h,
			s = (max === 0 ? 0 : d / max),
			v = max / 255;
	
		switch (max) {
			case min: h = 0; break;
			case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
			case g: h = (b - r) + d * 2; h /= 6 * d; break;
			case b: h = (r - g) + d * 4; h /= 6 * d; break;
		}
	
		return {
			h: h,
			s: s,
			v: v
		};
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
		const max = this.getMax(data);
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = 255 * Math.pow(data[i] / max, constant);
			data[i+1] = 255 * Math.pow(data[i+1] / max, constant);
			data[i+2] = 255 * Math.pow(data[i+2] / max, constant);
		}
	}

	private log(data) {
		const max = this.getMax(data);
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = 255 * Math.log(1 + data[i]) / Math.log(1 + max);
			data[i+1] = 255 * Math.log(1 + data[i+1]) / Math.log(1 + max);
			data[i+2] = 255 * Math.log(1 + data[i+2]) / Math.log(1 + max);
		}
	}

	private linearContrast(data) {
		const min = this.getMin(data);
		const max = this.getMax(data);
		for (var i = 0; i < data.length; i+= 4) {
			data[i] = (255 * (data[i] - min)) / (max - min);
			data[i+1] = (255 * (data[i+1] - min)) / (max - min);
			data[i+2] = (255 * (data[i+2] - min)) / (max - min);
		}
	}

	private histogramEqualization(data) {
		let hist = new Array(256);
		for (let i = 0; i < hist.length; i++) {
			hist[i] = 0;
		}
		for (let i = 0; i < data.length; i+= 4) {
			hist[data[i]]++;
			hist[data[i+1]]++;
			hist[data[i+2]]++;
		}
		const arrSum = arr => arr.reduce((a,b) => a + b, 0);
		for (let i = 0; i < hist.length; i++) {
			hist[i] /= arrSum(hist);
		}

		let cumulativeHist = new Array(256);
		for (let i = 0; i < cumulativeHist.length; i++) {
			cumulativeHist[i] = 0;
		}
		for (let i = 0; i < cumulativeHist.length; i++) {
			for (let j = 0; j < i; j++) {
				cumulativeHist[i] += hist[j];
			}
		}

		for (let i = 0; i < data.length; i+= 4) {
			data[i] = Math.floor(cumulativeHist[data[i]] * 255);
			data[i+1] = Math.floor(cumulativeHist[data[i+1]] * 255);
			data[i+2] = Math.floor(cumulativeHist[data[i+2]] * 255);
		}
	}

	private histogramEqualizationHSV(data) {
		for (let i = 0; i < data.length; i+= 4) {
			const hsv = this.RGBtoHSV(data[i], data[i+1], data[i+2]);
			data[i] = hsv.h;
			data[i+1] = hsv.s;
			data[i+2] = hsv.v;
		}

		let hist = new Array(100);
		for (let i = 0; i < hist.length; i++) {
			hist[i] = 0;
		}
		for (let i = 0; i < data.length; i+= 4) {
			hist[data[i+2]]++;
		}
		const arrSum = arr => arr.reduce((a,b) => a + b, 0);
		for (let i = 0; i < hist.length; i++) {
			hist[i] /= arrSum(hist);
		}

		let cumulativeHist = new Array(100);
		for (let i = 0; i < cumulativeHist.length; i++) {
			cumulativeHist[i] = 0;
		}
		for (let i = 0; i < cumulativeHist.length; i++) {
			for (let j = 0; j < i; j++) {
				cumulativeHist[i] += hist[j];
			}
		}

		for (let i = 0; i < data.length; i+= 4) {
			data[i+2] = Math.floor(cumulativeHist[data[i+2]] * 100);
		}

		for (let i = 0; i < data.length; i+= 4) {
			const rgb = this.HSVtoRGB(data[i], data[i+1], data[i+2]);
			data[i] = rgb.r;
			data[i+1] = rgb.g;
			data[i+2] = rgb.b;
		}
	}

	private getMax(arr) {
		return arr.reduce((max, v) => max >= v || v === 255 ? max : v, -Infinity);
	}

	private getMin(arr) {
		return arr.reduce((min, v) => min <= v ? min : v, Infinity);
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
			case 'Linear contrast':
				this.linearContrast(imageData.data);
				break;
			case 'Histogram Equalization':
				this.histogramEqualization(imageData.data);
				break;
			case 'Histogram Equalization HSV':
				this.histogramEqualizationHSV(imageData.data);
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
						{ key: 'Log', text: 'Log' },
						{ key: 'Linear contrast', text: 'Linear contrast' },
						{ key: 'Histogram Equalization', text: 'Histogram Equalization' },
						{ key: 'Histogram Equalization HSV', text: 'Histogram Equalization HSV' }						
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

