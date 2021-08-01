import { Meteor } from "meteor/meteor";
import React, { useState, Fragment } from "react";
import { useTracker } from "meteor/react-meteor-data";
import { Task } from "./Task";
import { TasksCollection } from "/imports/db/TasksCollection";
import { TaskForm } from "./TaskForm";
import { LoginForm } from "./LoginForm";

export const App = () => {
  const user = useTracker(() => Meteor.user());

  const [hideCompleted, setHideCompleted] = useState(false);

  const hideCompletedFilter = { isChecked: { $ne: true } };

  const userFilter = user ? { userId: user._id } : {};

  const pendingOnlyFilter = { ...hideCompletedFilter, ...userFilter };

  const { tasks, pendingTasksCount, isLoading } = useTracker(() => {
    const noDataAvailable = { tasks: [], pendingTasksCount: 0 };
    if (!Meteor.user()) {
      return noDataAvailable;
    }
    const handler = Meteor.subscribe("tasks");

    if (!handler.ready()) {
      return { ...noDataAvailable, isLoading: true };
    }

    const tasks = TasksCollection.find(
      hideCompleted ? pendingOnlyFilter : userFilter,
      {
        sort: { createdAt: -1 },
      }
    ).fetch();
    const pendingTasksCount = TasksCollection.find(pendingOnlyFilter).count();

    return { tasks, pendingTasksCount };
  });

  const toggleChecked = ({ _id, isChecked }) =>
    Meteor.call("tasks.setIsChecked", _id, !isChecked);

  const deleteTask = ({ _id }) => Meteor.call("tasks.remove", _id);

  const pendingTasksTitle = `${
    pendingTasksCount ? ` ${pendingTasksCount}` : "0"
  }`;

  const logout = () => Meteor.logout();

  return (
    <div className="app">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark ">
        <a className="navbar-brand" href="/sorting-visualizer">
          <b>7 Days, 7 Projects - Meteor To Do List (Day 5/7)</b>
        </a>

        <button
          className="navbar-toggler"
          type="button"
          data-toggle="collapse"
          data-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="https://jj1.dev/projects">
                More Projects
              </a>
            </li>
          </ul>
        </div>
      </nav>
      <div className="main">
        {user ? (
          <Fragment>
            <h1>Pending tasks: {pendingTasksTitle}</h1>

            <div className="user" onClick={logout}>
              {user.username} 🚪
            </div>
            <TaskForm user={user} />

            <div className="filter">
              <button onClick={() => setHideCompleted(!hideCompleted)}>
                {hideCompleted ? "Show All" : "Hide Completed"}
              </button>
            </div>

            {isLoading && <div className="loading">loading...</div>}

            <ul className="tasks">
              {tasks.map((task) => (
                <Task
                  key={task._id}
                  task={task}
                  onCheckboxClick={toggleChecked}
                  onDeleteClick={deleteTask}
                />
              ))}
            </ul>
          </Fragment>
        ) : (
          <LoginForm />
        )}
      </div>
    </div>
  );
};
