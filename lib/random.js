export function RandomFloat(minimum, maximum) {
  return Math.random() * (maximum - minimum) + minimum;
}

export function Random(minimum, maximum) {
  return Math.floor(RandomFloat(minimum, maximum));
}

export function PickRandom(array) {
  return array[Math.floor(Math.random() * array.length)];
}
