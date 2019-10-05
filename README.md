# passport-scanner
A Chrome extension which uses text recognition to verify passport information. 

## Installation
In order to arm this extension, edith this part of ```manifest.json``` to the backoffice url:

      "matches": [
        "http://YOUR-PATH/*"
      ],
      
 Go to ```chrome://extensions/``` and add the repo as an unpacked folder. No need for ```npm install``` as that's just eslint. 

## Usage
Press 1 and click on the frontside image of the passport. Then press 2 and click on the backside image of the passport.
On top of the page it should now show ```loading...```. The analysis takes about 20 seconds.
