const Logger = {
  enabled: false,

  log(...o: any[]) {
    if (this.enabled) {
      o.unshift('FFlog:');
      console.log(...o);
    }
  },

  warn(...o: any[]) {
    if (this.enabled) {
      o.unshift('FFwarn:');
      console.log(...o);
    }
  },

  error(...o: any[]) {
    if (this.enabled) {
      o.unshift('FFerror:');
      console.log(...o);
    }
  },
};

export { Logger };
