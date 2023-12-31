const updateParserState = (state, index, result) => ({
  ...state,
  index,
  result,
});

const updateParserResult = (state, result) => ({
  ...state,
  result,
});

const updateParserError = (state, errorMsg) => ({
  ...state,
  isError: true,
  error: errorMsg,
});

class Parser {
  constructor(parserStateTransformerFn) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run = (targetString) => {
    const initialState = {
      targetString,
      index: 0,
      result: null,
      isError: false,
      error: null,
    };
    return this.parserStateTransformerFn(initialState);
  };

  map_p(fn) {
    // parser in --->  parser out   // parse is a string, this is not same func as map function
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      return updateParserResult(nextState, fn(nextState.result));
    });
  }

  chain(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) return nextState;

      const nextParser = fn(nextState.result);

      return nextParser.parserStateTransformerFn(nextState);
    });
  }

  errorMap(fn) {
    return new Parser((parserState) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (!nextState.isError) return nextState;

      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }
}

const str = (s) =>
  new Parser((parserState) => {
    // initially index is 0
    const { targetString, index, isError } = parserState;

    if (isError) {
      return parserState;
    }

    if (targetString.slice(index).startsWith(s)) {
      return updateParserState(parserState, index + s.length, s);
    }

    return updateParserError(parserState, `letters: Got unexpected error`);
  });

const lettersRegex = /^[A-Za-z]+/;
const letters = new Parser((parserState) => {
  const { targetString, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `letters: Got Unexpected end of input.`
    );
  }

  const regexMatch = slicedTarget.match(lettersRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `letters: Couldn't match letters at index ${index}`
  );
});

const digitsRegex = /^[0-9]+/;
const digits = new Parser((parserState) => {
  const { targetString, index, isError } = parserState;

  if (isError) {
    return parserState;
  }

  const slicedTarget = targetString.slice(index);

  if (slicedTarget.length === 0) {
    return updateParserError(
      parserState,
      `digits: Got Unexpected end of input.`
    );
  }

  const regexMatch = slicedTarget.match(digitsRegex);

  if (regexMatch) {
    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0]
    );
  }

  return updateParserError(
    parserState,
    `digits: Couldn't match digits at index ${index}`
  );
});

const sequenceOf = (parsers) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }
    const results = [];
    let nextState = parserState;

    for (let p of parsers) {
      nextState = p.parserStateTransformerFn(nextState);
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });

const choice = (parsers) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    for (let p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) {
        return nextState;
      }
    }

    return updateParserError(
      parserState,
      `choice: Unable to match with any parser at index ${parserState.index}`
    );
  });
// choice is eather one of them

const many = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      let testState = parser.parserStateTransformerFn(nextState);

      if (!testState.isError) {
        results.push(testState.result);
        nextState = testState;
      } else {
        done = true;
      }
    }

    return updateParserResult(nextState, results);
  });
// try to match as many time as they can

const many1 = (parser) =>
  new Parser((parserState) => {
    if (parserState.isError) {
      return parserState;
    }

    let nextState = parserState;
    const results = [];
    let done = false;

    while (!done) {
      const nextState = parser.parserStateTransformerFn(nextState);
      if (!nextState.isError) {
        results.push(nextState.result);
      } else {
        done = true;
      }
    }

    if (results.length === 0) {
      return updateParserError(
        parserState,
        `many1: Unable to match any input using parser @ index ${parserState.index}`
      );
    }

    return updateParserResult(nextState, results);
  });
// match many or at least one

const sepBy = (separatorParser) => (valueParser) =>
  new Parser((parserState) => {
    const results = [];
    let nextState = parserState;

    while (true) {
      const thingWeWantState = valueParser.parserStateTransformerFn(nextState);
      if (thingWeWantState.isError) {
        break;
      }
      results.push(thingWeWantState.result);
      nextState = thingWeWantState;

      const separatorState =
        separatorParser.parserStateTransformerFn(nextState);
      if (separatorState.isError) {
        break;
      }
      nextState = separatorState;
    }

    return updateParserResult(nextState, results);
  });

const between = (leftParser, rightParser) => (contentParser) =>
  sequenceOf([leftParser, contentParser, rightParser]).map_p((res) => res[1]);

//const parser = sequenceOf([digits, letters, digits]);

//const parser = many(choice([digits, letters]));
const betweenBrackets = between(str("("), str(")"));
//const parser = betweenBrackets(letters);

// "string:hello"
// "number:42"
// "diceroll:2d8"

const stringParser = letters.map_p((result) => ({
  type: "string",
  value: result,
}));

const numberParser = digits.map_p((result) => ({
  type: "number",
  value: Number(result),
}));

const dicerollParser = sequenceOf([digits, str("d"), digits]).map_p(
  ([n, _, s]) => ({
    type: "diceroll",
    value: [Number(n), Number(s)],
  })
);

const parser = sequenceOf([letters, str(":")])
  .map_p((results) => results[0])
  .chain((type) => {
    if (type === "string") {
      return stringParser;
    } else if (type === "number") {
      return numberParser;
    }
    return dicerollParser;
  });

console.log(parser.run("diceroll:2d8"));
console.log(parser.run("number:42"));

const lazy = (parserThunk) =>
  new Parser((parserState) => {
    const parser = parserThunk();
    return parser.parserStateTransformerFn(parserState);
  });

const betweenSquaredBrackets = between(str("["), str("]"));
const commaSeparated = sepBy(str(","));

//const parser1 = betweenSquaredBrackets(commaSeperated(digits));
const value = lazy(() => choice([digits, arrayParser]));

const arrayParser = betweenSquaredBrackets(commaSeparated(value));
console.log(arrayParser.run("[1,[2,[3],4],5]"));
//console.log(parser1.run("[1,2,3,4,5]"));

//console.log(parser.run("(hello)"));

//const parser = letters;

//console.log(parser.run("abc12345"));

/*const parser = str("hello!")
      .map((result) => ({
        value: result.toUpperCase(),
      }))
      .errorMap((msg, index) => `Expected a greeting @ index ${index}`);
    
    console.log(parser.run("hello!"));
    
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
