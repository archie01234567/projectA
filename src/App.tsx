import { useState } from 'react';

import './App.css';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <header className="app__header">
        <img src="/vite.svg" className="app__logo" alt="Vite logo" />
        <h1>Welcome to Project A</h1>
      </header>
      <main className="app__main">
        <p>Edit <code>src/App.tsx</code> and save to test HMR.</p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>
          count is {count}
        </button>
      </main>
    </div>
  );
}

export default App;
