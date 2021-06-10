const notificationBox = document.getElementById('notification')

export function notify(msg) {
  notificationBox.innerHTML = msg
  if(notificationBox.classList.contains('closed')) {
    notificationBox.classList.remove('closed')
  }
}

export function timedNotification(msg, timer) {
  notify(msg)
  setTimeout(closeNotification, timer)
}

export function closeNotification() {
  if(!notificationBox.classList.contains('closed')) {
    notificationBox.classList.add('closed')
  }
}