const $ = require('jquery');

let $notifyDiv = null; 

export const setupNotifications = () => {
  $notifyDiv = $("#notifications-window");
  $notifyDiv.css('width', '25%');
  $notifyDiv.css('height', '25%');
  $notifyDiv.css('position', 'absolute');
  $notifyDiv.css('top', '10px');
  $notifyDiv.css('right', '10px');
  $notifyDiv.css('color', 'white');
  $notifyDiv.css('text-align', 'right');
  $notifyDiv.css('overflow', 'hidden');
  $notifyDiv.css('background', 'rgba(0,0,0, 0.2)');
  $notifyDiv.css('padding', '10px');
  $notifyDiv.css('display', 'none');
}

export const notify = (msg) => {
  $notifyDiv.css('display', 'block');

  $notifyDiv.html( msg + '<br />' + $notifyDiv.html() );
};

