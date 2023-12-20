const numberOfHabits = document.querySelector(".numberOfHabits");

numberOfHabits.addEventListener("input", addHabits);

function addHabits() {
  let habits = document.querySelector(".habits");
  habits.innerHTML = "";

  const numberOfHabits = Number(
    document.querySelector(".numberOfHabits").value
  );

  if (numberOfHabits > 10) {
    habits.innerHTML =
      "<p class='error'>Please enter a number less than 10</p>";
  } else if (numberOfHabits === 0) {
    habits.innerHTML =
      "<p class='error'>Please enter a number greater than 0</p>";
  } else {
    for (let i = 1; i <= numberOfHabits; i++) {
      let div = document.createElement("div");

      div.innerHTML = `<div class="habit" data-habitNumber="${i}">
    <input type="text" name="habitNames" class="habitNames" placeholder="Habit ${i}: Must Match Property on Database"></div>`;

      habits.appendChild(div);
    }
  }
}

const chartColor = document.querySelector(".chartColor");

chartColor.addEventListener("input", function () {
  watchBaseColorPicker(chartColor.value)
});

const graph = document.querySelector(".graph");
const chartBackgroundRadios = document.querySelectorAll(
  'input[name="chartBackground"]'
);

Array.from(chartBackgroundRadios).forEach((radio) => {
  radio.addEventListener("change", function () {
    const selectedValue = this.value;
    graph.style = `background-color: ${selectedValue}`;
  });
});

const newChartMode = document.querySelector(".newChartMode")
console.log(newChartMode)

const mode = newChartMode.getAttribute('data-newChartMode') === 'lightMode' ? 'Light' : 'Dark'

let root = document.documentElement;
let scale2 = document.getElementById(`scale2${mode}`);
let scale3 = document.getElementById(`scale3${mode}`);
let scale4 = document.getElementById(`scale4${mode}`);
let scale1 = document.getElementById(`scale1${mode}`);
let scale0 = document.getElementById(`scale0${mode}`);


  // this function from CSS Tricks (https://css-tricks.com/converting-color-spaces-in-javascript/)
  function hexToHSL(H) {
    // Convert hex to RGB first
    let r = 0, g = 0, b = 0;
    if (H.length == 4) {
      r = "0x" + H[1] + H[1];
      g = "0x" + H[2] + H[2];
      b = "0x" + H[3] + H[3];
    } else if (H.length == 7) {
      r = "0x" + H[1] + H[2];
      g = "0x" + H[3] + H[4];
      b = "0x" + H[5] + H[6];
    }
    // Then to HSL
    r /= 255;
    g /= 255;
    b /= 255;
    let cmin = Math.min(r,g,b),
        cmax = Math.max(r,g,b),
        delta = cmax - cmin,
        h = 0,
        s = 0,
        l = 0;
  
    if (delta == 0)
      h = 0;
    else if (cmax == r)
      h = ((g - b) / delta) % 6;
    else if (cmax == g)
      h = (b - r) / delta + 2;
    else
      h = (r - g) / delta + 4;
  
    h = Math.round(h * 60);
  
    if (h < 0)
      h += 360;
  
    l = (cmax + cmin) / 2;
    s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    s = +(s * 100).toFixed(1);
    l = +(l * 100).toFixed(1);
  
    return [h, s+"%", l+"%"];
  }
  
  // this function from CSS Tricks (https://css-tricks.com/converting-color-spaces-in-javascript/)
  function RGBToHex(r,g,b) {
    r = r.toString(16);
    g = g.toString(16);
    b = b.toString(16);
  
    if (r.length == 1)
      r = "0" + r;
    if (g.length == 1)
      g = "0" + g;
    if (b.length == 1)
      b = "0" + b;
  
    return "#" + r + g + b;
  }
  
  // this function from CSS Tricks (https://css-tricks.com/converting-color-spaces-in-javascript/)
  function hexToRGB(h) {
    let r = 0, g = 0, b = 0;
  
    // 3 digits
    if (h.length == 4) {
      r = "0x" + h[1] + h[1];
      g = "0x" + h[2] + h[2];
      b = "0x" + h[3] + h[3];
  
    // 6 digits
    } else if (h.length == 7) {
      r = "0x" + h[1] + h[2];
      g = "0x" + h[3] + h[4];
      b = "0x" + h[5] + h[6];
    }
    
    return "rgb("+ +r + "," + +g + "," + +b + ")";
  }
  
  
  function getBrightness(r,g,b) {
    let rValue = r*0.2126;
    let gValue = g*0.7152;
    let bValue = b*0.0722;
    return rValue + gValue + bValue;
  }
  
  function getColorValues() { 
    let scale2Value = window.getComputedStyle(scale2, null).getPropertyValue("background-color");
    let scale3Value = window.getComputedStyle(scale3, null).getPropertyValue("background-color");
    let baseValue = window.getComputedStyle(scale4, null).getPropertyValue("background-color");
    let scale1Value = window.getComputedStyle(scale1, null).getPropertyValue("background-color");
    let scale0Value = window.getComputedStyle(scale0, null).getPropertyValue("background-color");
    return [scale2Value, scale3Value, baseValue, scale1Value, scale0Value];
  }
  
  
  function randomColor () {
      // random color check from CSS Tricks (https://css-tricks.com/snippets/javascript/random-hex-color/)
    const randomColor = "#" + Math.floor(Math.random()*16777215).toString(16);
    return hexToHSL(randomColor);
  }
  
  function cleanRGB() {
    let values = getColorValues();
    let hexValues = [];
    
    for (let value of values) {
      value = value.substring(4);
      value = value.substring(0, value.length-1);
      value = value.split(",");
      let r = parseInt(value[0]);
      let g = parseInt(value[1]);
      let b = parseInt(value[2]);
      let hex = RGBToHex(r, g, b);
      hexValues.push(hex);
    }
    return hexValues;
  }
  
  function setHexValues() {
    let values = cleanRGB();
    
    scale2.innerHTML = values[0];
    scale3.innerHTML = values[1];
    scale4.innerHTML = values[2];
    scale1.innerHTML = values[3];
    scale0.innerHTML = values[4];
   }
  
  function getTextColors() {
    let textColors = [];
    let colors = cleanRGB();
    for(let color of colors) {
      color = hexToRGB(color);
      color = color.substring(4);
      color = color.substring(0, color.length-1);
      color = color.split(",");
      let r = parseInt(color[0]);
      let g = parseInt(color[1]);
      let b = parseInt(color[2]);
      let brightness = getBrightness(r, g, b);
      if (brightness < 75) {
        textColors.push("white");
      } else {textColors.push("black");}
    }
    return textColors;
  }
  
  function setTextColors() {
    let values = getTextColors();
    
    scale2.style.color = values[0];
    scale3.style.color = values[1];
    scale4.style.color = values[2];
    scale1.style.color = values[3];
    scale0.style.color = values[4];
  }
  
  
  function resetInputColor() {
    let baseColor = cleanRGB()[2];
    baseColorPicker.value = baseColor;
  }
  
  function watchBaseColorPicker (colorPicker) {
    let newColor = hexToHSL(colorPicker);
    root.style.setProperty('--colorBase-h', newColor[0]);
    root.style.setProperty('--colorBase-s', newColor[1]);
    root.style.setProperty('--colorBase-l', newColor[2]);
    
    setHexValues();
  }