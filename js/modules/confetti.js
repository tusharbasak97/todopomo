/**
 * Confetti Module
 * Handles confetti animation on task completion
 */

var ran = function (min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

var Confetti = {
  active: false,
  amount: 25,
  size: 1,
  colors: [
    "hsl(0, 100%, 50%)", // Red
    "hsl(300, 100%, 50%)", // Magenta
    "hsl(240, 100%, 50%)", // Blue
    "hsl(120, 100%, 50%)", // Green
    "hsl(60, 100%, 50%)", // Yellow
    "hsl(30, 100%, 55%)", // Orange
    "hsl(270, 100%, 60%)", // Purple
    "hsl(180, 100%, 45%)", // Cyan
    "hsl(15, 100%, 50%)", // Red-Orange
    "hsl(195, 100%, 50%)", // Blue-Green
    "hsl(330, 100%, 55%)", // Pink
    "hsl(90, 100%, 45%)", // Lime Green
    "hsl(210, 100%, 50%)", // Sky Blue
    "hsl(45, 100%, 50%)", // Gold
    "hsl(285, 100%, 50%)", // Violet
  ],
  newPiece: function () {
    var n = document.createElement("div");
    n.style.width = 4 + "px";
    n.style.height = 6 + "px";
    n.style.position = "absolute";
    n.style.left = "10px";
    n.style.top = "5px";
    n.style.opacity = 0;
    n.style.pointerEvents = "none";
    n.style.backgroundColor = this.colors[ran(0, 14)];
    return n;
  },
  render: function (event) {
    var el = event.target;
    var c = Confetti.newPiece();
    var s = Confetti.size;
    var degs = 0;
    var x = 0;
    var y = 0;
    var opacity = 0;
    var count = 0;

    // Smaller, tighter spread around checkbox - responsive to screen size
    var xfactor;
    var yfactor = ran(8, 80) * (1 + s / 10); // Reduced vertical spread

    // Randomly choose left or right direction with smaller spread
    if (ran(0, 2) === 1) {
      xfactor = ran(3, 20) * (1 + s / 10); // Reduced horizontal spread
    } else {
      xfactor = ran(-3, -20) * (1 + s / 10); // Reduced horizontal spread
    }

    var start = null;
    el.appendChild(c);
    var animate = function (timestamp) {
      if (!start) {
        start = timestamp;
      }
      var progress = timestamp - start;
      if (progress < 2000) {
        window.requestAnimationFrame(animate);
      } else {
        el.removeChild(c);
      }
      c.style.opacity = opacity;
      c.style.webkitTransform =
        "translate3d(" +
        Math.cos((Math.PI / 36) * x) * xfactor +
        "px, " +
        Math.cos((Math.PI / 18) * y) * yfactor +
        "px, 0) rotateZ(" +
        degs +
        "deg) rotateY(" +
        degs +
        "deg)";
      degs += 15;
      x += 0.5;
      y += 0.5;
      if (count > 25) {
        opacity -= 0.1;
      } else {
        opacity += 0.1;
      }
      count++;
    };
    window.requestAnimationFrame(animate);
  },
  fire: function (event) {
    if (event.target.classList.length === 1) {
      event.target.classList.add("checked");
      var count = 0;
      var launch = setInterval(function () {
        if (count < Confetti.amount) {
          Confetti.render(event);
          count++;
        } else {
          clearTimeout(launch);
        }
      }, 32);
      Confetti.active = true;
    } else {
      event.target.classList.remove("checked");
      Confetti.active = false;
    }
  },
  fireOnElement: function (element) {
    var count = 0;
    var launch = setInterval(function () {
      if (count < Confetti.amount) {
        Confetti.renderOnElement(element);
        count++;
      } else {
        clearTimeout(launch);
      }
    }, 32);
  },
  renderOnElement: function (element) {
    var el = element;
    var c = Confetti.newPiece();
    var s = Confetti.size;
    var degs = 0;
    var x = 0;
    var y = 0;
    var opacity = 0;
    var count = 0;

    // Smaller, tighter spread around checkbox - responsive to screen size
    var xfactor;
    var yfactor = ran(8, 20) * (1 + s / 10); // Reduced vertical spread

    // Randomly choose left or right direction with smaller spread
    if (ran(0, 2) === 1) {
      xfactor = ran(3, 20) * (1 + s / 10); // Reduced horizontal spread
    } else {
      xfactor = ran(-3, -20) * (1 + s / 10); // Reduced horizontal spread
    }

    var start = null;
    el.appendChild(c);
    var animate = function (timestamp) {
      if (!start) {
        start = timestamp;
      }
      var progress = timestamp - start;
      if (progress < 2000) {
        window.requestAnimationFrame(animate);
      } else {
        el.removeChild(c);
      }
      c.style.opacity = opacity;
      c.style.webkitTransform =
        "translate3d(" +
        Math.cos((Math.PI / 36) * x) * xfactor +
        "px, " +
        Math.cos((Math.PI / 18) * y) * yfactor +
        "px, 0) rotateZ(" +
        degs +
        "deg) rotateY(" +
        degs +
        "deg)";
      degs += 15;
      x += 0.5;
      y += 0.5;
      if (count > 25) {
        opacity -= 0.1;
      } else {
        opacity += 0.1;
      }
      count++;
    };
    window.requestAnimationFrame(animate);
  },
  bindEvents: function () {
    var elements = document.querySelectorAll(this.element);
    for (var i = 0; i < elements.length; i++) {
      elements[i].onclick = Confetti.fire;
    }
  },
  init: function (el, amt, size) {
    this.element = el;
    this.amount = amt;
    this.size = size;
    this.bindEvents();
  },
};

export { Confetti };
