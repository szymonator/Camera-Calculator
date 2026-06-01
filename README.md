You can currently find this project at: https://www.dcs.warwick.ac.uk/~u5685010/my_web_calculator/

For some reason it didn't work on my friend's browser (he uses Linux, I don't know if that means anything) but the issue was with the Mediapipe library itself which was weird.
I first built the whole thing in Python then realised that if I want it to be a website it needs to be in JS unless I want to have a backend, so I translated everything to JavaScript.
I took the large amount of pictures required using picture_taker.py and messed around with the library in other files - main.py is the working version, in Python.
After translating to JavaScript I realised I wanted to make a nice UI, and had found a neat website at isobelsweb.com which introduced me to the Neocities "style" of website which I found interesting and more lively than the current dull themes of modern webdev. I borrowed the idea for the cursor trail from that website specifically.

The first time I opened the website outside of my room, it took a crazy long time to load and performance was terrible - I wasn't entirely sure why since the previous day it had been working fine. Might've been due to connection issues with Eduroam.
