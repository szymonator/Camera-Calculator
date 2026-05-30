const help = [
                {image: "./images/0.png", caption: "When gesturing a number, you start from the thumb. I.e. just your thumb is 1, your thumb, index, and middle fingers are 3, and an open palm is 5. For best results, have your palm facing the camera."}, 
                {image: "./images/1.png", caption: "You can gesture numbers from 1 to 10 by using both hands. Gesturing 3 and 5 will give 8."}, 
                {image: "./images/2.png", caption: "Addition is gestured by showing the sides of your palms, one vertical, the other horizontal, as shown."}, 
                {image: "./images/3.png", caption: "Multiplication is gestured by showing the sides of your palms, both diagonal. The orientation and location technically doesn't matter, but for best results the angle should be 45°."}, 
                {image: "./images/4.png", caption: "Subtraction is gestured by showing the side of your horizontal palm. Make sure your other hand isn't in the field of view."},
                {image: "./images/5.png", caption: "Division is just like subtraction, but with a diagonal palm"}, 
                {image: "./images/6.png", caption: "To gesture equals, show the sides of both of your horizontal palms."}, 
                {image: "./images/7.png", caption: "Order of operations applies."},
                {image: "./images/8.png", caption: "To start a new equation after gesturing equals, simply gesure a new number."},
                {image: "./images/9.png", caption: "If the sides of your palms are glitching, move them away from your face."}
            ];

let currentSlideIndex = 0;
const instruction = document.getElementById('caption');
const example = document.getElementById('gesture');
const slide = document.getElementById('slide');

function giveInformation(index) {
    info = help[index];
    example.setAttribute('src', info.image);
    instruction.innerText = info.caption;
    slide.innerText = (currentSlideIndex+1).toString() + "/10";
    return;
}

function next() {
    if (currentSlideIndex === 9) {
        currentSlideIndex = 0;
    } else {
        currentSlideIndex++;
    }
    giveInformation(currentSlideIndex);
}

function previous() {
    if (currentSlideIndex === 0) {
        currentSlideIndex = 9;
    } else {
        currentSlideIndex--;
    }
    giveInformation(currentSlideIndex);
}

giveInformation(currentSlideIndex);