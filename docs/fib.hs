function fib(n : number) : number {
  if (n <= 2)
    return 1;
  return fib(n - 2) + fib(n - 1);
}

var x = 1;
while (x <= 10) {
  insert(str(fib(x)) + "\n");
  x = x + 1;
}
