# Google Actions Name Shuffler

## Data

https://www.meetup.com/GDG-Zurich/events/244679385/attendees

```js
Array.from(document.querySelectorAll('.attendee-item')).map(attendeeElement => attendeeElement.querySelector('h4').innerText)
```
