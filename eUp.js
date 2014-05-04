Images = new Meteor.Collection('images');
Alerts = new Meteor.Collection(null);

if (Meteor.isClient) {
  var debug = true;
  var inc = 15;
  var images = new Array();
  var delim = 'b'; // http://api.imgur.com/models/image
  var over = false;
  Session.set('fv', false);
    
  function preload(arrayOfImages) {
      $(arrayOfImages).each(function(){
          $('<img/>')[0].src = imgurDelim(this, delim);
      });
  }    

  function imgurDelim(url, del){
   return url.substring(0,url.length - 4) + del + url.substring(url.length - 4); 
  }  
  
  function unDelim(url){
   return url.substring(0,url.length - 5) + url.substring(url.length - 4); 
  }  
  
  function alertFlash(m, t, time, fo){
    var x = Alerts.insert({message:m, type:t});
    setTimeout(function(){
      $('#' + x).fadeOut(fo, function(){
        Alerts.remove({_id:x});
      });
      
    }, time);
  
  }
  
  window.af = function(m,t,time,fo){alertFlash(m,t,time,fo)};
  
  window.prerender = function(){
    preload(Images.find({}, {sort: {date: -1}}).fetch().slice(inc));
  };
  
  Session.set('load', inc);

  UI.registerHelper('imlist', function(){
  	return Images.find({}, {sort: {date: -1}}).fetch().slice(0,Session.get('load'));
  });
  
  UI.registerHelper('viewurl', function(){
  	return Images.findOne({_id:Session.get('fvid')}).address;
  });  

  UI.registerHelper('poster', function(){
  	var name = Images.findOne({_id:Session.get('fvid')}).name;
  	return name?name:"Anon";//if it doesn't have a name, for some strange reason...
  })

  UI.registerHelper('fv', function(){
  	return Session.get('fv');
  });  
  
  UI.registerHelper('alerts', function(){
  	return Alerts.find();
  });
  
  UI.registerHelper('canLoad', function(){
    return Session.get('load') < Images.find().count();
  });
  
  UI.registerHelper('imCount', function(){
    return Images.find().count();
  });
  
  UI.registerHelper('small', function(url){
    return imgurDelim(url, delim);
  });

  
  Template.main.events({
    'click #loadMore': function(){
      Session.set('load', Session.get('load') + inc);
    },
    'click img':function(event){
      Session.set('fvid', event.currentTarget.id);
      Session.set('fv', true);
    }
  });
  

  
  Template.outer.events({
    'click':function(event){
      if(!over && event.target.tagName.toLowerCase() != "img")
        Session.set('fv', false);
    }
  });
  
  Template.fullView.events({
    'mousemove #fvimg':function(){
      over = true;
    },
    'mouseleave #fvimg':function(){
      over = false;
    }
  });    

  $(function(){
    var doc = window;
    doc.ondragover = function () { this.className = 'hup'; return false; };
    doc.ondragend = function () { this.className = ''; return false; };
    doc.ondrop = function (event) {
      if(!Meteor.user()){
        alertFlash("You need to be logged in to upload!", "warning", 1000, 250);
        return false;
      }
      
      event.preventDefault && event.preventDefault();
      this.className = '';
      var files = event.dataTransfer.files;
      
      var x = files.length;
      var alertId = Alerts.insert({type:'info', num:0, max:x});
      

      for(var i = 0; i < files.length; i++){
        if(files[i] && files[i].name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)){
          window.last = files[i];          
          fileToImage(files[i], alertId);

        }

      }

      return false;
    };
    window.prerender();
    
    window.onmousewheel = function() {
       if($(window).scrollTop() + $(window).height() == $(document).height() || $(document).height() <= $(window).height()) {
         if(Session.get('load') < Images.find().count()){//still more stuff to load...
           Session.set('load', Session.get('load') + inc);
         }
       }
    };    
    
  });

  function fileToImage(file, aid){

    var reader = new FileReader();
    var image;
    reader.onload = function(event){
      image = new Image();
      image.src = event.target.result;
      image.width = 250;
      upload(image.src, aid);
    };


    reader.readAsDataURL(file);

  }
  
  function addAlert(t, m){
    Alerts.insert({type:t, message:m});
  }
  


  function upload(img, aid){
  	img = img.split(',')[1];
    $.ajax({
        url: 'https://api.imgur.com/3/image',
        type: 'post',
        headers: {
            Authorization: 'Client-ID [YOUR IMGUR CLIENT ID]'
        },
        data: {
            image: img
        },
        dataType: 'json',
        success: function(response) {
            if(response.success) {
                url = response.data.link;
                Meteor.call('add', url);
              
                Alerts.update({_id:aid},{$inc:{num:1}});
                
                Alerts.find().forEach(function(a){
                  if(a.num >= a.max)
                  {
                    Alerts.remove({_id:a._id});
                    
                    alertFlash("All images successfully uploaded!", "success", 1000, 100);
                    
                  }
                });

            }
        },
      error: function(xhr, ajaxOptions, thrownError){
        var t = Alerts.insert({message:xhr.status + ": " + thrownError, type:"danger"});
        setTimeout(function(){
          $('#' + t).fadeOut(100, function(){
            Alerts.remove({_id:t});
          });
          
        }, 1000);      
      }
    });


  }



}

if (Meteor.isServer) {
  Meteor.methods({
    add : function(url){
      if(Meteor.user())
        Images.insert({address:url, name:Meteor.user().services.facebook.name, date:new Date()});
      else
        Images.insert({address:url, name:"Anon", date:new Date()});
    }

  })

}
