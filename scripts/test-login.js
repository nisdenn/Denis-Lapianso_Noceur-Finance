async function test() {
  const res = await fetch('http://localhost:3000/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'username=admin&password=admin123'
  });
  console.log(res.status);
  const text = await res.text();
  console.log(text.substring(0, 500));
}
test();
