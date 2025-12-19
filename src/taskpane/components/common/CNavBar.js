const NavBar = ({setView}) => {

  return (
      <nav>
      <ul>
          <li>
          <button onClick={() => setView('home')}>Home</button>
          </li>
          <li>
          <button onClick={() => setView('test')}>Test</button>
          </li>
      </ul>
      </nav>
  );
}

export default NavBar;
