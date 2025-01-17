import {Socket} from "phoenix"
import LiveSocket, {DOM} from '../js/phoenix_live_view'

let after = (time, func) => setTimeout(func, time)

let simulateInput = (input, val) => {
  input.value = val
  DOM.dispatchEvent(input, "input")
}

let container = () => {
  let div = document.createElement("div")
  div.innerHTML = `
  <form phx-change="validate" phx-submit="submit">
    <input type="text" name="blur" phx-debounce="blur" />
    <input type="text" name="debounce-100" phx-debounce="100" />
    <input type="text" name="throttle-100" phx-throttle="100" />
    <button id="throttle-100" phx-throttle="100" />+</button>
  </form>
  `
  return div
}

describe("debounce", function() {
  test("triggers on input blur", async () => {
    let calls = 0
    let el = container().querySelector("input[name=blur]")

    DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    DOM.dispatchEvent(el, "blur")
    expect(calls).toBe(1)

    DOM.dispatchEvent(el, "blur")
    DOM.dispatchEvent(el, "blur")
    DOM.dispatchEvent(el, "blur")
    expect(calls).toBe(4)
  })

  test("triggers on timeout", done => {
    let calls = 0
    let el = container().querySelector("input[name=debounce-100]")

    el.addEventListener("input", () => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    })
    simulateInput(el, "one")
    simulateInput(el, "two")
    simulateInput(el, "three")
    after(100, () => {
      expect(calls).toBe(1)
      expect(el.value).toBe("three")
      simulateInput(el, "four")
      simulateInput(el, "five")
      simulateInput(el, "six")
      after(100, () => {
        expect(calls).toBe(2)
        expect(el.value).toBe("six")
        done()
      })
    })
  })

  test("cancels trigger on phx-change", done => {
    let calls = 0
    let el = container().querySelector("input[name=debounce-100]")

    el.addEventListener("input", () => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    })
    el.form.addEventListener("phx-change", () => {
      el.value = "phx-changed"
    })
    simulateInput(el, "changed")
    DOM.dispatchEvent(el.form, "phx-change")
    after(100, () => {
      expect(calls).toBe(0)
      expect(el.value).toBe("phx-changed")
      simulateInput(el, "changed again")
      after(100, () => {
        expect(calls).toBe(1)
        expect(el.value).toBe("changed again")
        done()
      })
    })
  })

  test("cancels trigger on submit", done => {
    let calls = 0
    let el = container().querySelector("input[name=debounce-100]")

    el.addEventListener("input", () => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    })
    el.form.addEventListener("submit", () => {
      el.value = "submitted"
    })
    simulateInput(el, "changed")
    DOM.dispatchEvent(el.form, "submit")
    after(100, () => {
      expect(calls).toBe(0)
      expect(el.value).toBe("submitted")
      simulateInput(el, "changed again")
      after(100, () => {
        expect(calls).toBe(1)
        expect(el.value).toBe("changed again")
        done()
      })
    })
  })
})

describe("throttle", function() {
  test("triggers immediately, then on timeout", done => {
    let calls = 0
    let el = container().querySelector("#throttle-100")

    el.addEventListener("click", e => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => {
        calls++
        el.innerText = `now:${calls}`
      })
    })
    DOM.dispatchEvent(el, "click")
    DOM.dispatchEvent(el, "click")
    DOM.dispatchEvent(el, "click")
    expect(calls).toBe(1)
    expect(el.innerText).toBe("now:1")
    after(100, () => {
      expect(calls).toBe(1)
      expect(el.innerText).toBe("now:1")
      DOM.dispatchEvent(el, "click")
      DOM.dispatchEvent(el, "click")
      DOM.dispatchEvent(el, "click")
      after(100, () => {
        expect(calls).toBe(2)
        expect(el.innerText).toBe("now:2")
        done()
      })
    })
  })

  test("cancels trigger on phx-change", done => {
    let calls = 0
    let el = container().querySelector("input[name=throttle-100]")
    let otherInput = el.form.querySelector("input[name=debounce-100]")

    el.addEventListener("input", () => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    })
    el.form.addEventListener("phx-change", () => {
      el.value = "phx-changed"
    })
    simulateInput(el, "changed")
    simulateInput(el, "changed2")
    DOM.dispatchEvent(el.form, "phx-change", {triggeredBy: otherInput})
    expect(calls).toBe(1)
    expect(el.value).toBe("phx-changed")
    simulateInput(el, "changed3")
    after(100, () => {
      expect(calls).toBe(2)
      expect(el.value).toBe("changed3")
      done()
    })
  })

  test("cancels trigger on submit", done => {
    let calls = 0
    let el = container().querySelector("input[name=throttle-100]")

    el.addEventListener("input", () => {
      DOM.debounce(el, "phx-debounce", "phx-throttle", () => calls++)
    })
    el.form.addEventListener("submit", () => {
      el.value = "submitted"
    })
    simulateInput(el, "changed")
    simulateInput(el, "changed2")
    DOM.dispatchEvent(el.form, "submit")
    expect(calls).toBe(1)
    expect(el.value).toBe("submitted")
    simulateInput(el, "changed3")
    after(100, () => {
      expect(calls).toBe(2)
      expect(el.value).toBe("changed3")
      done()
    })
  })
})


