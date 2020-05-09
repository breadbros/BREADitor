let verboseLogging = false;

export const setVerboseLogging = (onOrOff) => {
  verboseLogging = !!onOrOff;
  console.log( 'verboseLogging now: ' + verboseLogging );
}

export const getVerboseLogging = () => {
  return verboseLogging;
}

export const INFO = () => {
  if(verboseLogging) {
    console.info( arguments );
  }
}

export const LOG = () => {
  if(verboseLogging) {
    console.log( arguments );
  }
}

export const WARN = () => {
  if(verboseLogging) {
    console.warn( arguments );
  }
}

// no suppressions on errors!
export const ERROR = () => {
  console.error( arguments );
}