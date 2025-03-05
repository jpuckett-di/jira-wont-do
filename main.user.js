// ==UserScript==
// @name        Jira Won't Do
// @namespace   Violentmonkey Scripts
// @match       https://carscommerce.atlassian.net/jira/software/c/projects/*
// @match       https://carscommerce.atlassian.net/browse/*
// @grant       none
// @author      Jeff Puckett
// @version 1.0.0
// @description Automates closing tickets as "Won't Do"
// ==/UserScript==
function findIssueKey() {
  return document.querySelector(
    'a[data-testid="issue.views.issue-base.foundation.breadcrumbs.current-issue.item"] span'
  ).innerText;
}

function getTransitionsUrl() {
  return `https://carscommerce.atlassian.net/rest/api/3/issue/${findIssueKey()}/transitions`;
}

function getAvailableTransitions() {
  return fetch(getTransitionsUrl(), {
    method: 'GET',
    headers: {
      'Accept': 'application/json'
    }
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      console.log('Available transitions:', data.transitions);
      return data.transitions;
    })
    .catch(error => {
      console.error('Error fetching transitions:', error);
    });
}

function makeTimeLogRequestUrl() {
  return `https://carscommerce.atlassian.net/rest/internal/3/issue/${findIssueKey()}/worklog?adjustEstimate=auto`;
}

function makeTimeLogJson() {
  const date = new Date();
  // Format the date with timezone offset directly
  const etOptions = { timeZone: "America/New_York", hour12: false };
  const etDate = new Date(date.toLocaleString("en-US", etOptions));

  // Format with timezone offset
  const offset = etDate.getTimezoneOffset();
  const offsetHours = Math.abs(Math.floor(offset / 60))
    .toString()
    .padStart(2, "0");
  const offsetMinutes = Math.abs(offset % 60)
    .toString()
    .padStart(2, "0");
  const offsetStr = `${offset <= 0 ? "+" : "-"}${offsetHours}${offsetMinutes}`;

  const isoWithOffset = etDate.toISOString().slice(0, -1) + offsetStr;

  return JSON.stringify({
    timeSpent: "1m",
    comment: { type: "doc", version: 1, content: [] },
    started: isoWithOffset,
  });
}

function submitTime() {
  fetch(makeTimeLogRequestUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json,text/javascript,*/*",
    },
    body: makeTimeLogJson(),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      console.log("Time logged successfully:", data);
    })
    .catch((error) => {
      console.error("Error logging time:", error);
    });
}

function createButton() {
  const button = document.createElement("button");
  button.textContent = "Won't Do";
  button.style.position = "fixed";
  button.style.top = "0px";
  button.style.right = "0px";
  button.style.zIndex = "1000";
  button.style.backgroundColor = "#d04437";
  button.style.color = "#ffffff";
  button.style.cursor = "pointer";
  button.onclick = getAvailableTransitions;
  document.body.prepend(button);
}

createButton();
