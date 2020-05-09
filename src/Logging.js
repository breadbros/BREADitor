let verboseLogging = true;

export const setVerboseLogging = (onOrOff) => {
  verboseLogging = !!onOrOff;
  console.log( 'verboseLogging now: ' + verboseLogging );
}

export const getVerboseLogging = () => {
  return verboseLogging;
}

export const INFO = () => {
  if(verboseLogging) {
    console.info.apply( console, Array.prototype.slice.call(arguments, 0) );
  }
}

export const LOG = () => {
  if(verboseLogging) {
    console.log.apply( console, Array.prototype.slice.call(arguments, 0) );
  }
}

export const WARN = () => {
  if(verboseLogging) {
    console.warn.apply( console, Array.prototype.slice.call(arguments, 0) );
  }
}

// no suppressions on errors!
export const ERROR = () => {
  console.error.apply( console, Array.prototype.slice.call(arguments, 0) );
}