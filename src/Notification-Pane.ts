const {$} = window;

let $notifyDiv:any = null; 

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
  $notifyDiv.css('background', 'rgba(0,0,0, 0.5)');
  $notifyDiv.css('padding', '10px');
  $notifyDiv.css('z-index', '2000000000');
  $notifyDiv.css('display', 'none');
}

let fadeOutTimerId:NodeJS.Timeout|null = null;
const fadeOutTriggerTimeInMs = 1500;
const fadeOutAnimationTimeInMs = 500;

const fadeoutCallbackFn = () => {};

export const notify = (msg:string) => {
  const now = new Date();
  const time = `${now.getHours()  }:${  now.getMinutes()  }:${  now.getSeconds()}`;

  if($notifyDiv) {
    $notifyDiv.css('display', 'block');

    $notifyDiv.html( `${time  } ${  msg.replace(/\n/g, '<br>')  }<br />${  $notifyDiv.html()}` );

    setFadeOutTimer();
  }
};

const setFadeOutTimer = () => {
  if(fadeOutTimerId !== null) {
    clearTimeout(fadeOutTimerId);
    fadeOutTimerId = null;
  }

  fadeOutTimerId = setTimeout( () => {
      $notifyDiv!.fadeOut(fadeOutAnimationTimeInMs, "linear", fadeoutCallbackFn );

  }, fadeOutTriggerTimeInMs);
};
