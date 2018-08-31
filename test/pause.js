async function pause (time) {
  console.log(new Date())
  await new Promise(
    (resolve) => {
      setTimeout(() => {
        resolve('over')
      }, time)
    })
  console.log(new Date())
}

pause(5000)
console.log(11 % 10)
