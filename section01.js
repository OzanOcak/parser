const str = (s) => (targetString) => {
  if (targetString.startsWith(s)) {
    return targetString;
  }
  throw new Error(
    `Tried to match "${s}", but found "${targetString.slice(0, 10)}`
  );
};

const res = str("hello world!")("hello world!");

console.log(res);
