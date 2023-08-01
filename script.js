for (let i = 0; i < 13; i++) {
  const dupThing = document.querySelector(".views").cloneNode(true);
  const imgElement = document.createElement('img');
  imgElement.src = "";
  imgElement.style.position = 'absolute';
  imgElement.style.width = '100%';
  imgElement.style.height = '100%';
  imgElement.style.objectFit = 'cover';
  imgElement.style.borderRadius = '8px';
  dupThing.appendChild(imgElement);
  document.querySelector(".container").appendChild(dupThing);
}

const elems2 = document.querySelectorAll(".views");
let x = 0, y = 0, angle = 0;
for (let i = 0; i < elems2.length; i++) {
  const elem = elems2[i];
  x = 184 * Math.cos(angle) + 190;
  y = 184 * Math.sin(angle) + 190;
  elem.style.position = 'absolute';
  elem.style.left = x + 'px';
  elem.style.top = y + 'px';
  const rot = 0 + (i * (360 / elems2.length));
  elem.style.transform = "rotate(" + rot + "deg)";
  angle += Math.PI * 2 / elems2.length;

  elem.addEventListener('click', function() {
    const url = prompt('Enter the URL of the image');
    if(url) {
      const img = elem.querySelector('img');
      if (img) img.src = url;
    }
  });
}


const prevClick = document.querySelector('#prevClick');
const nextClick = document.querySelector('#nextClick');
const container = document.querySelector('.container');
let count = 0;
const degCalc = 360 / elems2.length;

prevClick.addEventListener('click', function () {
  count--;
  if (count < 0) {
    count = elems2.length - 1;
  }
  let deg = count * degCalc;
  container.style.transform = "rotate(" + deg + "deg)";
});

nextClick.addEventListener('click', function () {
  count++;
  if (count >= elems2.length) {
    count = 0;
  }
  let deg = count * degCalc;
  container.style.transform = "rotate(" + deg + "deg)";
});

const labelElement = document.getElementById('label');

labelElement.addEventListener('click', () => {
  labelElement.contentEditable = true;
  labelElement.focus();
});

function adjustFontSize() {
  const maxSize = 20; 
  const containerWidth = labelElement.parentElement.clientWidth;
  const containerHeight = labelElement.parentElement.clientHeight; // Get the container height
  const maxTextWidth = 100 - 20; // Maximum width minus padding (left and right)
  const maxTextHeight = 75 - 10; // Maximum height minus padding (top and bottom)

  const cloneElement = labelElement.cloneNode(true);
  cloneElement.style.visibility = 'hidden';
  cloneElement.style.position = 'absolute';
  cloneElement.style.width = 'auto';
  cloneElement.style.maxWidth = maxTextWidth + 'px'; 
  cloneElement.style.whiteSpace = 'normal'; 
  cloneElement.style.overflow = 'hidden'; 
  cloneElement.textContent = labelElement.textContent;
  document.body.appendChild(cloneElement);

  const textWidth = cloneElement.clientWidth;
  const textHeight = cloneElement.clientHeight;
  document.body.removeChild(cloneElement);

  let newFontSize = maxSize;
  if (textWidth > maxTextWidth || textHeight > maxTextHeight) {
    const widthRatio = maxTextWidth / textWidth;
    const heightRatio = maxTextHeight / textHeight;
    const minRatio = Math.min(widthRatio, heightRatio);
    newFontSize = Math.floor(maxSize * minRatio);
  }
  labelElement.style.fontSize = newFontSize + 'px';
}



labelElement.addEventListener('input', adjustFontSize);




const exportReelBtn = document.getElementById('exportReel');
const outerElement = document.querySelector('.outer');

exportReelBtn.addEventListener('click', function() {
  const imageElems = document.querySelectorAll('.views'); 

  const imageURLs = Array.from(imageElems).map(elem => {
      const img = elem.querySelector('img');
      let imgSrc = img ? img.getAttribute('src') : "";
      
      if(imgSrc !== "") {
          return imgSrc;
      }

      const style = window.getComputedStyle(elem);
      
      let backgroundImage = style.getPropertyValue('background-image');
      backgroundImage = backgroundImage.replace('url(', '').replace(')', '').replace(/"/g, '');
      
      return backgroundImage;
  });

  const outerColor = window.getComputedStyle(outerElement).backgroundColor;

  const data = {
      color: outerColor,
      images: imageURLs,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));

  const downloadAnchorNode = document.createElement('a');
  downloadAnchorNode.setAttribute('href', dataStr);
  downloadAnchorNode.setAttribute('download', 'imageData.json');
  document.body.appendChild(downloadAnchorNode); // Required for Firefox I guess lol
  downloadAnchorNode.click();
  downloadAnchorNode.remove();
});

const loadReelBtn = document.getElementById('loadReel');
const loadReelInput = document.getElementById('loadReelInput');

loadReelBtn.addEventListener('click', function() {
    loadReelInput.click();
});

loadReelInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        const contents = e.target.result;
        const data = JSON.parse(contents);
        
        outerElement.style.background = data.color;

        const imageElems = document.querySelectorAll('.views');
        for(let i = 0; i < data.images.length; i++) {
            const imgElem = imageElems[i];
            const img = imgElem.querySelector('img');
            if(img) {
                img.src = data.images[i];
            } else {
                const imgElement = document.createElement('img');
                imgElement.src = data.images[i];
                imgElement.style.position = 'absolute';
                imgElement.style.width = '100%';
                imgElement.style.height = '100%';
                imgElement.style.objectFit = 'cover';
                imgElement.style.borderRadius = '8px';
                imgElem.appendChild(imgElement);
            }
        }
    };
    reader.readAsText(file);
});

const colorPicker = document.getElementById('colorPicker');

colorPicker.addEventListener('input', function() {
  outerElement.style.background = colorPicker.value;
});
