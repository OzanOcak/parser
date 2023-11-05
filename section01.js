const str = (s) => (parserState) => {
  // initially index is 0
  const { targetString, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  if (targetString.slice(index).startsWith(s)) {
    return { ...parserState, result: s, index: index + s.length }; // if they're equal , result is s
  }

  return {
    ...parserState,
    error: `Tried to match "${s}", but got "${targetString.slice(
      index,
      index + 10
    )}`,
    isError: true,
  };
};

const sequenceOf = (parsers) => (parserState) => {
  if (parserState.isError) {
    return parserState;
  }
  const results = [];
  let nextState = parserState;

  for (let p of parsers) {
    nextState = p(nextState);
    results.push(nextState.result);
  }

  return {
    ...nextState,
    result: results,
  };
};

const run = (parser, targetString) => {
  const initialState = {
    targetString,
    index: 0,
    result: null,
    isError: false,
    error: null,
  };
  return parser(initialState);
};

const parser = str("hello!");

console.log(run(parser, "hello"));

/**
 
{
  targetString: 'hello',
  index: 0,
  result: null,
  isError: true,
  error: 'Tried to match "hello!", but got "hello'
}
  
 */

//const parser = sequenceOf([str("hello!"), str("goodbye!")]); //  str get first argument

//console.log(run(parser, "hello!goodbye!"));
