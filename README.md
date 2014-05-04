# eUp

### What's it do?

Basically, eUp allows for the mass upload of images to the cloud. It stores the images on imgur's servers, but collects the list of URLs where each image is stored. Images are uploaded by dragging them onto the page.

### Getting started

To get this working, substitute '[YOUR IMGUR CLIENT ID]' with your actual imgur client id in eUp.js, line 173. You'll also need a Facebook app code, if you choose to integrate it with Facebook. If not, modify the code appropriately, replacing Meteor.user().services.facebook.name with however you're gonna get the user's name.