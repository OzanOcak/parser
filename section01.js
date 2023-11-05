const str = (s) => (targetString) => {
  if (targetString.startsWith(s)) {
    return targetString;
  }
  throw new Error(
    `Tried to match "${s}", but found "${targetString.slice(0, 10)}`
  );
};

const run = (parser, targetString) => {
  //str assigns parser &  parse get the second argument
  return parser(targetString);
};

const parser = str("hello!"); //  str get first argument

console.log(run(parser, "hello!"));
