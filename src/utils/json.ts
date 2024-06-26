const toJson = (obj: any): string | null => {
  try {
    // Define a helper const to handle different types of objects
    const serialize = (o: any): any => {
      // If the object is a serializable type, return it directly
      if (
        typeof o === 'number' ||
        typeof o === 'boolean' ||
        typeof o === 'string' ||
        o === null
      ) {
        return o;
      }
      // If the object is binary data, convert it to a base64-encoded string
      else if (o instanceof Buffer) {
        return '*** binary data ***';
      }
      // If the object is a dictionary, recursively process each key-value pair
      else if (typeof o === 'object') {
        if (Array.isArray(o)) {
          return o.map(serialize);
        } else {
          const result: { [key: string]: any } = {};
          for (const key in o) {
            result[key] = serialize(o[key]);
          }
          return result;
        }
      }
      // If the object is a custom type, try to return its __dict__ property
      else if (o.hasOwnProperty('__dict__')) {
        return serialize(o.__dict__);
      }
      // In other cases, return null (or you can choose to throw an exception)
      else {
        return null;
      }
    };

    // Use the serialize const to process the input object
    const serializedObj = serialize(obj);
    return JSON.stringify(serializedObj, null, 4);
  } catch (e) {
    return null;
  }
};

export { toJson };
