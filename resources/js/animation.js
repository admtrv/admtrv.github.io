/*
 * animation.js
 */

// dynamic dimensions auto by available space
let animationWidth = 90;
let animationHeight = 9;

const animationUpdateRate = 0.9
const animationDeltaTime = 0.005

// character size in px approx monospace
const CHAR_WIDTH = 8.4;     // approx char width at 14px
const CHAR_HEIGHT = 14;     // line height in px

const animationAsciiPallet = [
    "rgb",
    "\\ /",
    "0 1 2 3 4 5 6 7 8 9",
    "@%#+=*:-. ",
    "xyz",
    " git init ",
    "fiit",
    "c/c++",
    "&Oi?+~>:. ",
    " .!?",
    "[ { ( ) } ]",
    " .. . ...",
    "hello world!",
    " 011 010 101 ",
    "sed",
    "lol",
    ":) :( :D :P",
    " -~",
    "`'-.,_,.-'`",
    "s S $",
    ". o O Q q .",
    "  ..zzZZ",
    " _|TL",
    "admtrv"
];

const animationColorPallet = [
    { r:  31 / 255, g: 176 / 255, b: 210 / 255 },
    { r: 183 / 255, g: 179 / 255, b: 167 / 255 },
    { r: 222 / 255, g: 151 / 255, b:  68 / 255 },
    { r: 206 / 255, g: 207 / 255, b: 203 / 255 },
    { r: 253 / 255, g: 246 / 255, b: 249 / 255 },
    { r: 105 / 255, g: 157 / 255, b: 126 / 255 },
    { r:   0 / 255, g: 130 / 255, b: 194 / 255 },
    { r:   0 / 255, g:   0 / 255, b: 162 / 255 },
    { r: 130 / 255, g:   0 / 255, b:   0 / 255 },
    { r: 255 / 255, g: 130 / 255, b:   2 / 255 },
    { r: 130 / 255, g: 131 / 255, b: 138 / 255 },
    { r:  58 / 255, g:  49 / 255, b:  72 / 255 },
    { r: 130 / 255, g: 132 / 255, b:  66 / 255 },
    { r: 176 / 255, g:  65 / 255, b: 115 / 255 },
    { r:  70 / 255, g:  56 / 255, b:  89 / 255 },
    { r: 167 / 255, g: 126 / 255, b:  56 / 255 },
];

const textColor = " #101010";
const backgroundColor = " #f0f0f0"

var animationDefaultTitle = "";
var animationDefaultSeed = "";

var animationCurrentTitle = "";
var animationCurrentSeed = "";

var animationDataTarget = {};
var animationDataCurrent = {};

var animationBoard = [];

var animationTime = 0;

// resize debounce timeout
let resizeTimeout;

function seedHash(seed) {   // djb2
    let hash = 5381;
    for (let i = 0; i < seed.length; i++) {
        const charCode = seed.charCodeAt(i);
        hash = (hash << 5) + hash + charCode;
    }
    return hash;
}

function hash(a) {
    const multiplier = 75.9794;
    const amplitude = 9073.6093;
    const shift = 1.0;
    const normalization = 2.0;

    let hash = Math.sin(a * multiplier) * amplitude;

    return (hash % 1.0 + shift) / normalization;
}

function hash2d(x, y) {
    const multiplierX = 21.0351;
    const multiplierY = 16.6736;
    const amplitude = 9985.6343;
    const shift = 1.0;
    const normalization = 2.0;

    let hash = Math.sin((x * multiplierX) + (y * multiplierY)) * amplitude;

    return (hash % 1.0 + shift) / normalization;
}

function hashRange(a, min, max) {
    return hash(a) * (max - min) + min;
}

function hashChoice(a, arr) {
    let index = Math.floor(hashRange(a, 0, arr.length));
    index = Math.min(index, arr.length - 1);
    
    return arr[index];
}

function lerp(x, y, t) {
    return (1 - t) * x + t * y;
}

function lerpColor(x, y, t) {
    let c = {
        r: lerp(x.r, y.r, t),
        g: lerp(x.g, y.g, t),
        b: lerp(x.b, y.b, t),
    };

    return c;
}

function PerlinNoise(x, y, octaves) {
    let result = 0;
    for (let i = 0; i < octaves; i++) {
        let frequency = Math.pow(2, i);
        let amplitude = Math.pow(0.5, octaves - i);

        let pX = x * frequency;
        let pY = y * frequency;

        let oX = Math.floor(pX);
        let oY = Math.floor(pY);

        let aX = pX % 1.0;
        let aY = pY % 1.0;

        let top = lerp(hash2d(oX, oY), hash2d(oX + 1, oY), aX);
        let bottom = lerp(hash2d(oX, oY + 1), hash2d(oX + 1, oY + 1), aX);

        result += amplitude * lerp(top, bottom, aY);
    }
    return Math.max(Math.min(result, 1), 0);
}

// calc dimensions by available space
function calculateDimensions() {
    const animationElement = document.getElementById('animation');
    if (!animationElement) return;
    
    const container = animationElement.parentElement;
    if (!container) return;
    
    // available width in px
    const containerStyle = window.getComputedStyle(container);
    const containerPadding = parseFloat(containerStyle.paddingLeft) + parseFloat(containerStyle.paddingRight);
    const availableWidth = container.clientWidth - containerPadding;
    
    // max chars horizontal
    const maxCharsHorizontal = Math.floor(availableWidth / CHAR_WIDTH);
    
    // min and max width
    // min should allow wrapped text
    const MIN_WIDTH = 20;
    const MAX_WIDTH = 120;
    animationWidth = Math.max(MIN_WIDTH, Math.min(maxCharsHorizontal, MAX_WIDTH));
    
    // height by title wrapping
    animationHeight = calculateRequiredHeight();
}

// split text into words
function splitIntoWords(text) {
    // split by spaces keep spaces
    const words = [];
    let currentWord = "";
    
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            if (currentWord.length > 0) {
                words.push(currentWord);
                currentWord = "";
            }
            // add space element for multiple spaces
            if (i === 0 || text[i - 1] !== ' ') {
                words.push(' ');
            }
        } else {
            currentWord += text[i];
        }
    }
    
    if (currentWord.length > 0) {
        words.push(currentWord);
    }
    
    return words;
}

// word wrap
function wrapTextByWords(text, maxWidth) {
    const words = splitIntoWords(text);
    const lines = [];
    let currentLine = "";
    
    for (const word of words) {
        if (word === ' ') {
            // add space if room
            if (currentLine.length > 0 && currentLine.length < maxWidth) {
                currentLine += ' ';
            }
        } else {
            // if word fits
            const testLine = currentLine.length === 0 ? word : currentLine + word;
            
            if (testLine.length <= maxWidth) {
                currentLine = testLine;
            } else {
                // new line
                if (currentLine.length > 0) {
                    // trim trailing space
                    lines.push(currentLine.trim());
                    currentLine = word;
                } else {
                    // force break long word
                    lines.push(word.substring(0, maxWidth));
                    currentLine = word.substring(maxWidth);
                }
            }
        }
    }
    
    if (currentLine.length > 0) {
        lines.push(currentLine.trim());
    }
    
    return lines;
}

// rows needed for title
function calculateRequiredHeight() {
    const TEXT_PADDING = 2;         // 2 chars padding
    const ANIMATION_BORDER = 1;     // 1 char animation border
    const MIN_HEIGHT = 9;           // min height
    const MAX_HEIGHT = 15;          // max height
    
    if (!animationCurrentTitle || animationCurrentTitle === "") {
        return 9; // default height no title
    }
    
    // available width for title
    const availableForTitle = animationWidth - (TEXT_PADDING * 2) - (ANIMATION_BORDER * 2);
    
    if (availableForTitle <= 0) {
        return MIN_HEIGHT;
    }
    
    // wrap and count lines
    const lines = wrapTextByWords(animationCurrentTitle, availableForTitle);
    const linesNeeded = lines.length;
    
    // total height
    const calculatedHeight = 3 + 1 + linesNeeded + 1 + 3;
    
    return Math.max(MIN_HEIGHT, Math.min(calculatedHeight, MAX_HEIGHT));
}

// window resize handler
function handleResize() {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
        const oldWidth = animationWidth;
        const oldHeight = animationHeight;
        
        calculateDimensions();
        
        // reinit only if size changed
        if (oldWidth !== animationWidth || oldHeight !== animationHeight) {
            initBoard();
            updateBoard();
        }
    }, 150); // debounce resize
}

function animationInit(title, seed) {
    animationDefaultTitle = title;
    animationDefaultSeed = seed;

    animationCurrentTitle = animationDefaultTitle;
    animationCurrentSeed = animationDefaultSeed;

    // initial dimensions
    calculateDimensions();
    
    initData();
    animationDataCurrent = { ...animationDataTarget };
    initBoard();
    
    // add resize listener
    window.addEventListener('resize', handleResize);
}
 
function animationSetTitle(title, seed) {
    const oldTitle = animationCurrentTitle;
    animationCurrentTitle = title;
    animationCurrentSeed = seed;
    
    // recalc height on title change
    const oldHeight = animationHeight;
    animationHeight = calculateRequiredHeight();
    
    if (oldHeight !== animationHeight) {
        initBoard();
    }
    
    initData();
}

function animationClearTitle() {
    const oldTitle = animationCurrentTitle;
    animationCurrentTitle = animationDefaultTitle;
    animationCurrentSeed = animationDefaultSeed;
    
    // recalc height on title change
    const oldHeight = animationHeight;
    animationHeight = calculateRequiredHeight();
    
    if (oldHeight !== animationHeight) {
        initBoard();
    }
    
    initData();
}

function initData() {
    let hashedSeed = 0x2c0ef4f7 ^ seedHash(animationCurrentSeed);
    
    animationDataTarget.scaleX = hashRange(hashedSeed ^ 0xdf94d7b0, 10, 200);
    animationDataTarget.scaleY = hashRange(hashedSeed ^ 0x7c9a00a9, 10, 200);
    
    animationDataTarget.offsetX = hashRange(hashedSeed ^ 0x87731084, -100, +100);
    animationDataTarget.offsetY = hashRange(hashedSeed ^ 0x7172d75a, -100, +100);
    
    animationDataTarget.firstSpeedX = hashRange(hashedSeed ^ 0x7ec91e46, -0.005, 0.005);
    animationDataTarget.firstSpeedY = hashRange(hashedSeed ^ 0x5f3577d1, -0.005, 0.005);
    animationDataTarget.secondSpeedX = hashRange(hashedSeed ^ 0x62e12da2, -0.01, 0.01);
    animationDataTarget.secondSpeedY = hashRange(hashedSeed ^ 0x350870df, -0.01, 0.01);
    
    animationDataTarget.secondFreqX = hashRange(hashedSeed ^ 0x3c47b77c, 1.5, 2.5);
    animationDataTarget.secondFreqY = hashRange(hashedSeed ^ 0xfdd1d292, 1.5, 2.5);
    
    animationDataTarget.firstMixX = hashRange(hashedSeed ^ 0xcc6b909e, 2.5, 3.5);
    animationDataTarget.firstMixY = hashRange(hashedSeed ^ 0x51b30d37, 2.5, 3.5);
    animationDataTarget.secondMixX = hashRange(hashedSeed ^ 0x16a69506, 2.5, 3.5);
    animationDataTarget.secondMixY = hashRange(hashedSeed ^ 0x94fa84df, 2.5, 3.5);
    
    animationDataTarget.opacityMix0 = hashRange(hashedSeed ^ 0xd0041538, 0.5, 1.5);
    animationDataTarget.opacityMix1 = hashRange(hashedSeed ^ 0x1b76f4e0, 0.5, 1.5);
    animationDataTarget.opacityMix2 = hashRange(hashedSeed ^ 0x333eefdd, 0.5, 1.5);
    animationDataTarget.opacityMix3 = hashRange(hashedSeed ^ 0x8720581f, 0.5, 1.5);
    
    animationDataTarget.color0 = hashChoice(hashedSeed ^ 0xea254ad1, animationColorPallet);
    animationDataTarget.color1 = hashChoice(hashedSeed ^ 0xdda990c0, animationColorPallet);
    animationDataTarget.color2 = hashChoice(hashedSeed ^ 0x09c8f9f5, animationColorPallet);
    animationDataTarget.color3 = hashChoice(hashedSeed ^ 0x21c37c56, animationColorPallet);
    animationDataTarget.color4 = hashChoice(hashedSeed ^ 0xa707955b, animationColorPallet);
    animationDataTarget.color5 = hashChoice(hashedSeed ^ 0xcca78318, animationColorPallet);
    
    animationDataTarget.asciiRange = hashChoice(hashedSeed ^ 0x3d8266ac, animationAsciiPallet);
}

function updateData() {     // interpolation from current to target
    animationDataCurrent.scaleX = lerp(animationDataCurrent.scaleX, animationDataTarget.scaleX, animationUpdateRate); 
    animationDataCurrent.scaleY = lerp(animationDataCurrent.scaleY, animationDataTarget.scaleY, animationUpdateRate);
    
    animationDataCurrent.offsetX = lerp(animationDataCurrent.offsetX, animationDataTarget.offsetX, animationUpdateRate); 
    animationDataCurrent.offsetY = lerp(animationDataCurrent.offsetY, animationDataTarget.offsetY, animationUpdateRate); 
    
    animationDataCurrent.firstSpeedX = lerp(animationDataCurrent.firstSpeedX, animationDataTarget.firstSpeedX, animationUpdateRate); 
    animationDataCurrent.firstSpeedY = lerp(animationDataCurrent.firstSpeedY, animationDataTarget.firstSpeedY, animationUpdateRate);
    animationDataCurrent.secondSpeedX = lerp(animationDataCurrent.secondSpeedX, animationDataTarget.secondSpeedX, animationUpdateRate);
    animationDataCurrent.secondSpeedY = lerp(animationDataCurrent.secondSpeedY, animationDataTarget.secondSpeedY, animationUpdateRate);

    
    animationDataCurrent.secondFreqX = lerp(animationDataCurrent.secondFreqX, animationDataTarget.secondFreqX, animationUpdateRate); 
    animationDataCurrent.secondFreqY = lerp(animationDataCurrent.secondFreqY, animationDataTarget.secondFreqY, animationUpdateRate); 
    
    animationDataCurrent.firstMixX = lerp(animationDataCurrent.firstMixX, animationDataTarget.firstMixX, animationUpdateRate); 
    animationDataCurrent.firstMixY = lerp(animationDataCurrent.firstMixY, animationDataTarget.firstMixY, animationUpdateRate); 
    animationDataCurrent.secondMixX = lerp(animationDataCurrent.secondMixX, animationDataTarget.secondMixX, animationUpdateRate); 
    animationDataCurrent.secondMixY = lerp(animationDataCurrent.secondMixY, animationDataTarget.secondMixY, animationUpdateRate); 
    
    animationDataCurrent.opacityMix0 = lerp(animationDataCurrent.opacityMix0, animationDataTarget.opacityMix0, animationUpdateRate); 
    animationDataCurrent.opacityMix1 = lerp(animationDataCurrent.opacityMix0, animationDataTarget.opacityMix0, animationUpdateRate); 
    animationDataCurrent.opacityMix2 = lerp(animationDataCurrent.opacityMix2, animationDataTarget.opacityMix2, animationUpdateRate); 
    animationDataCurrent.opacityMix3 = lerp(animationDataCurrent.opacityMix3, animationDataTarget.opacityMix3, animationUpdateRate); 
    
    animationDataCurrent.color0 = lerpColor(animationDataCurrent.color0, animationDataTarget.color0, animationUpdateRate); 
    animationDataCurrent.color1 = lerpColor(animationDataCurrent.color1, animationDataTarget.color1, animationUpdateRate); 
    animationDataCurrent.color2 = lerpColor(animationDataCurrent.color2, animationDataTarget.color2, animationUpdateRate); 
    animationDataCurrent.color3 = lerpColor(animationDataCurrent.color3, animationDataTarget.color3, animationUpdateRate); 
    animationDataCurrent.color4 = lerpColor(animationDataCurrent.color4, animationDataTarget.color4, animationUpdateRate); 
    animationDataCurrent.color5 = lerpColor(animationDataCurrent.color5, animationDataTarget.color5, animationUpdateRate); 
    
    animationDataCurrent.asciiRange = animationDataTarget.asciiRange;
}

function initBoard() {
    let content = "";
    for (let y = 0; y < animationHeight; y++) {
        for (let x = 0; x < animationWidth; x++) {
            content += `<span id="board_${y}_${x}" style="color:${backgroundColor}"> </span>`;
        }
        content += "\n";
    }
    document.getElementById("animation").innerHTML = content;
    
    animationBoard = []
    for (let y = 0; y < animationHeight; y++) {
        for (let x = 0; x < animationWidth; x++) {
            animationBoard.push(document.getElementById(`board_${y}_${x}`))
        }
    }
}

function updateBoard() {
    const TEXT_PADDING = 2;         // 2 chars padding around text
    const ANIMATION_BORDER = 1;     // 1 char animation border
    
    // title wrap
    if (animationCurrentTitle && animationCurrentTitle !== "") {
        const availableWidth = animationWidth - (TEXT_PADDING * 2) - (ANIMATION_BORDER * 2);
        
        if (availableWidth > 0) {
            // single line
            if (animationCurrentTitle.length <= availableWidth) {
                updateBoardSingleLineTitle();
            } else {
                // multi line
                updateBoardMultiLineTitle();
            }
        } else {
            // no space for title
            updateBoardNoTitle();
        }
    } else {
        // no title
        updateBoardNoTitle();
    }
}

function updateBoardSingleLineTitle() {
    const boardCenterHeight = Math.floor(animationHeight / 2);
    const TEXT_PADDING = 2;         // 2 chars padding around text
    const ANIMATION_BORDER = 1;     // 1 char animation border
    
    // symmetric horizontal pos
    const totalTextWidth = animationCurrentTitle.length;
    const totalBoxWidth = totalTextWidth + (TEXT_PADDING * 2) + (ANIMATION_BORDER * 2);
    
    // split remaining space evenly
    const remainingSpace = animationWidth - totalBoxWidth;
    const leftSpace = Math.floor(remainingSpace / 2);
    const rightSpace = remainingSpace - leftSpace;
    
    const boxStartX = leftSpace;
    const boxEndX = animationWidth - rightSpace - 1;
    
    // title pos
    const titleStart = boxStartX + ANIMATION_BORDER + TEXT_PADDING;
    const titleEnd = titleStart + totalTextWidth - 1;
    
    // inner bounds
    const paddingStartX = boxStartX + ANIMATION_BORDER;
    const paddingEndX = boxEndX - ANIMATION_BORDER;
    
    // vertical bounds
    const titleRow = boardCenterHeight;
    const boxStartY = titleRow - 1;
    const boxEndY = titleRow + 1;

    for (let y = 0; y < animationHeight; y++) {
        for (let x = 0; x < animationWidth; x++) {
            const cellIndex = y * animationWidth + x;
            const cell = animationBoard[cellIndex];

            // outside box
            if (y < boxStartY || y > boxEndY || x < boxStartX || x > boxEndX) {
                const { color, character } = generate(x, y);
                cell.style.color = color;
                cell.textContent = character;
            } 
            // top or bottom rows
            else if ((y === boxStartY || y === boxEndY) && x >= boxStartX && x <= boxEndX) {
                if (x === boxStartX || x === boxEndX) {
                    // corners
                    const { color, character } = generate(x, y);
                    cell.style.color = color;
                    cell.textContent = character;
                } else if (x >= paddingStartX && x <= paddingEndX) {
                    // white padding
                    cell.style.color = textColor;
                    cell.textContent = " ";
                } else {
                    // border sides
                    const { color, character } = generate(x, y);
                    cell.style.color = color;
                    cell.textContent = character;
                }
            }
            // middle row
            else if (y === titleRow) {
                if (x === boxStartX || x === boxEndX) {
                    // left right border
                    const { color, character } = generate(x, y);
                    cell.style.color = color;
                    cell.textContent = character;
                } else if (x >= titleStart && x <= titleEnd) {
                    // title text
                    const titleCharIndex = x - titleStart;
                    cell.style.color = textColor;
                    cell.textContent = animationCurrentTitle[titleCharIndex];
                } else {
                    // white padding
                    cell.style.color = textColor;
                    cell.textContent = " ";
                }
            }
            else {
                // safety
                cell.style.color = textColor;
                cell.textContent = " ";
            }
        }
    }
}

function updateBoardMultiLineTitle() {
    const TEXT_PADDING = 2;         // 2 chars padding around text
    const ANIMATION_BORDER = 1;     // 1 char animation border
    const availableWidth = animationWidth - (TEXT_PADDING * 2) - (ANIMATION_BORDER * 2);
    
    // wrap lines
    const lines = wrapTextByWords(animationCurrentTitle, availableWidth);
    
    // max line length
    let maxLineLength = 0;
    for (const line of lines) {
        maxLineLength = Math.max(maxLineLength, line.length);
    }
    
    // symmetric box
    const totalBoxWidth = maxLineLength + (TEXT_PADDING * 2) + (ANIMATION_BORDER * 2);
    
    // split remaining space evenly
    const remainingSpace = animationWidth - totalBoxWidth;
    const leftSpace = Math.floor(remainingSpace / 2);
    const rightSpace = remainingSpace - leftSpace;
    
    const boxStartX = leftSpace;
    const boxEndX = animationWidth - rightSpace - 1;
    
    // vertical pos
    const textBlockHeight = lines.length + 2;
    const boxStartY = Math.floor((animationHeight - textBlockHeight) / 2);
    const boxEndY = boxStartY + textBlockHeight - 1;
    
    // inner bounds
    const paddingStartX = boxStartX + ANIMATION_BORDER;
    const paddingEndX = boxEndX - ANIMATION_BORDER;
    const textStartX = boxStartX + ANIMATION_BORDER + TEXT_PADDING;
    const textAreaWidth = maxLineLength;
    
    for (let y = 0; y < animationHeight; y++) {
        for (let x = 0; x < animationWidth; x++) {
            const cellIndex = y * animationWidth + x;
            const cell = animationBoard[cellIndex];
            
            // outside box
            if (y < boxStartY || y > boxEndY || x < boxStartX || x > boxEndX) {
                const { color, character } = generate(x, y);
                cell.style.color = color;
                cell.textContent = character;
            }
            // top or bottom rows
            else if (y === boxStartY || y === boxEndY) {
                if (x === boxStartX || x === boxEndX) {
                    // corners
                    const { color, character } = generate(x, y);
                    cell.style.color = color;
                    cell.textContent = character;
                } else if (x > boxStartX && x < boxEndX) {
                    if (x >= paddingStartX && x <= paddingEndX) {
                        // white padding
                        cell.style.color = textColor;
                        cell.textContent = " ";
                    } else {
                        // border
                        const { color, character } = generate(x, y);
                        cell.style.color = color;
                        cell.textContent = character;
                    }
                }
            }
            // side borders
            else if (x === boxStartX || x === boxEndX) {
                const { color, character } = generate(x, y);
                cell.style.color = color;
                cell.textContent = character;
            }
            // inside
            else {
                const lineIndex = y - boxStartY - 1;
                
                if (lineIndex >= 0 && lineIndex < lines.length) {
                    // text line
                    const line = lines[lineIndex];
                    // center line
                    const lineStart = textStartX + Math.floor((textAreaWidth - line.length) / 2);
                    const charIndex = x - lineStart;
                    
                    if (charIndex >= 0 && charIndex < line.length) {
                        // title char
                        cell.style.color = textColor;
                        cell.textContent = line[charIndex];
                    } else {
                        // white padding
                        cell.style.color = textColor;
                        cell.textContent = " ";
                    }
                } else {
                    // white padding rows
                    cell.style.color = textColor;
                    cell.textContent = " ";
                }
            }
        }
    }
}

function updateBoardNoTitle() {
    for (let y = 0; y < animationHeight; y++) {
        for (let x = 0; x < animationWidth; x++) {
            const cellIndex = y * animationWidth + x;
            const cell = animationBoard[cellIndex];
            
            const { color, character } = generate(x, y);
            cell.style.color = color;
            cell.textContent = character;
        }
    }
}

function generate(x, y) {
    const data = animationDataCurrent;
    
    let offsetX = data.offsetX + (x / data.scaleX);     // offset coordinates
    let offsetY = data.offsetY + (y / data.scaleY);
    
    let firstX = PerlinNoise(offsetX, offsetY, 4);      // primary waves generation
    let firstY = PerlinNoise(offsetX + animationTime * data.firstSpeedY, offsetY + animationTime * data.firstSpeedY, 4);
    
    let secondX = PerlinNoise(offsetX + data.secondFreqX * firstX + animationTime * data.secondSpeedX, offsetY + data.secondFreqX * firstY + animationTime * data.secondSpeedX, 4);     // secondary waves generation
    let secondY = PerlinNoise(offsetX + data.secondFreqY * firstX + animationTime * data.secondSpeedY, offsetY + data.secondFreqY * firstY + animationTime * data.secondSpeedY, 4);
    
    let finalX = offsetX + firstX * data.firstMixX + secondX * data.secondMixX;     // combination of primary and secondary waves
    let finalY = offsetY + firstY * data.firstMixY + secondY * data.secondMixY;

    let character = PerlinNoise(finalX, firstX, 2);     // character

    let color = lerpColor(data.color0, data.color1, firstX);    // color
    color = lerpColor(color, lerpColor(data.color2, data.color3, firstX * 0.5), secondY * 2.0);
    color = lerpColor(color,lerpColor(data.color4, data.color5 , firstY),secondX * secondY);

    let colorR = Math.min(Math.floor(color.r * 256), 255);
    let colorG = Math.min(Math.floor(color.g * 256), 255);
    let colorB = Math.min(Math.floor(color.b * 256), 255);
    
    let opacity = PerlinNoise( data.opacityMix0 * finalX + data.opacityMix1 * firstX, data.opacityMix2 * finalY + data.opacityMix3 * secondY, 4);   // transparency
    
    colorR = lerp(240, colorR, opacity);
    colorG = lerp(240, colorG, opacity);
    colorB = lerp(240, colorB, opacity);
    
    let characterAscii = data.asciiRange[Math.min(Math.floor(character * data.asciiRange.length), data.asciiRange.length - 1)];     // character ascii

    return {
        color: `rgb(${colorR},${colorG},${colorB})`,
        character: characterAscii,
    };
}

function animationLoop() {
    animationTime += animationDeltaTime;

    updateData();
    updateBoard();
    
    window.requestAnimationFrame(animationLoop);
}

// cleanup on unload
window.addEventListener('beforeunload', () => {
    window.removeEventListener('resize', handleResize);
});
