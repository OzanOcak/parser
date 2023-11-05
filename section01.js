const str = (s) => (parserState) => {
  // initially index is 0
  const { targetString, index } = parserState;
  if (targetString.slice(index).startsWith(s)) {
    return { ...parserState, result: s, index: index + s.length }; // if they're equal , result is s
  }
  throw new Error(
    `Tried to match "${s}", but found "${targetString.slice(index, index + 10)}`
  );
};

const run = (parser, targetString) => {
  const initialState = {
    targetString,
    index: 0,
    result: null,
  };
  return parser(initialState);
};

const parser = str("hello!"); //  str get first argument

console.log(run(parser, "hello!"));
