let verboseLogging = true;

export const setVerboseLogging = (onOrOff) => {
  verboseLogging = !!onOrOff;
  // console.log( 'verboseLogging now: ' + verboseLogging );
}

export const getVerboseLogging = () => {
  return verboseLogging;
}

export const INFO = (...args) => {
  if (verboseLogging) {
    console.info.apply(console, args);
  }
}

export const LOG = (...args) => {
  if (verboseLogging) {
    console.log.apply(console, args);
  }
}

export const WARN = (...args) => {
  if (verboseLogging) {
    console.warn.apply(console, args);
  }
}

// no suppressions on errors!
export const ERROR = (...args) => {
  console.error.apply(console, args);
}
