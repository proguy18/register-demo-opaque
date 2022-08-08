import React from "react";
import { testClientRegister } from "./api/clientRegister";
import { login, register, getUsers } from "../../api";

// type Props {}
// type State {
//     username: string
//     password: string
// }
export class Register extends React.Component {
  /*
   *  Client
   */
  user_id = "newuser";
  password = "correct horse battery staple";
  wrongPass = "correct horse battery staples";

  /*
   *  Server
   */
  database: any = {}; // Test database to show what user data gets stored
  //   constructor(props: Props) {
  //     super(props);
  //     this.state: State = {
  //       username: "",
  //       passward: "",
  //     };
  //   }

  //   handleChange = (e: any) => {
  //     this.setState({ [e.name.target]: e.target.value });
  //   };

  testRun = () => {
    // testClientRegister(this.password, this.user_id);
    register(this.user_id, this.password);
    getUsers();
  };

  render() {
    return (
      <div className="base-container">
        <div className="header">Register</div>
        <div className="content">
          <div className="image">{/* <img src = {loginImg} /> */}</div>
          <div className="form">
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                name="username"
                placeholder="username"
                // onChange={this.handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="text"
                name="password"
                placeholder="password"
                // onChange={this.handleChange}
              />
            </div>
          </div>
        </div>
        <div className="footer">
          <button type="button" className="btn">
            Register
          </button>
          <button type="button" className="btn" onClick={this.testRun}>
            Test Register
          </button>
        </div>
      </div>
    );
  }
}
