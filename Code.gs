function myFunction() 
{
  // Assume read messages have been approved
  var threads = GmailApp.search("from:(qldlearnerlogbook@tmr.qld.gov.au) is:unread");
  if (threads.length == 0)
  {
    console.log("No outstanding email threads found.");
    return;
  }

  for (thread of threads)
  {
    var messages = thread.getMessages();
    for (msg of messages)
    {
      // An email thread marked "unread" can still contain past messages that are marked "read". Check that this message is unread.
      if (!msg.isUnread())
      {
        continue;
      }

      console.log("Message time: " + msg.getDate());

      // Get URL of approval link
      // Example: http://learnerlogbooklnk.tmr.qld.gov.au/ls/click?upn=Cx15La-2BxZCiq-2BFyAcKZU7CL7-2BWL1H53FFU8yyU63Z0lej39N6dOqlPq4GP3ujlpJ5m58NxyE8GPS8MkkhiUqiiApD4ZOL-2FamQYo70rxYJO9sPkie
      //          WQuySlzsM7qvUfCNIu1UyC4MDGPbpBQqeQ9mmlUSl-2FcrcoSSK-2F-2BMustLoow-3Dim_U_HnlK5jKsOLO2iiE626ioWGaG-2BlIiNq7R-2FkbAcGwxnBke9enCs7YMZiK6YkV8kLP1U88iRrW8taUEBguTD9dQYPC-2BUz1-
      //          2BwkL-2FVeK6BU840yKhhvfNaZXilFY6MzOZTI9XE7saOC2bOJHS-2Fsy1HMuxEd9hMrnTtJl5ZtoJGi52l0qfn-2BHj3xF0gZiL-2BAy-2FvCMof8mw9AgekoYxe2azNh-2F5Fw-3D-3D
      var approvalRegex = new RegExp(/(<a href=")(.+)(">Approve this trip)/);
      var approvalRegexResult = approvalRegex.exec(msg.getBody());

      if (!approvalRegexResult) // Check if we found the approval link
      {
        console.log("Couldn't find \"Approve this trip\" link. Maybe this email is for multiple trips?");
        continue;
      }

      var approvalURL = approvalRegexResult[2];    // Index 2 gets the content of the second capture group in the regex
      console.log("Approval URL: " + approvalURL);

      // Load the approval link and get the URL the link redirects to
      // Example: https://learnerlogbookapp.tmr.qld.gov.au/ValidateTrip/?id=2c60dda2-e1a6-4b4a-b002-442352829224&noonce=dkmaaaa8
      var options = 
      {
        followRedirects: false
      }
      var pageResponse = UrlFetchApp.fetch(approvalURL, options);
      var redirectURL = pageResponse.getHeaders().Location;
      console.log("Redirect URL: " + redirectURL);

      // Get the ID and "noonce" of this link
      var tripID = new RegExp(/(id=)(.+)(&noonce)/).exec(redirectURL)[2];
      var tripNoonce = new RegExp(/(noonce=)(.+)$/).exec(redirectURL)[2];
      console.log("ID: " + tripID);
      console.log("Noonce: " + tripNoonce);
      
      // Submit HTML form to approve the trip
      var formData = {
        'id': tripID,
        'noonce': tripNoonce
      };
      var options = {
        'method': 'post',
        'payload': formData
      };
      var formResponse = UrlFetchApp.fetch("https://learnerlogbookapp.tmr.qld.gov.au/ValidateTrip/ApproveConfirm", options);
      console.log("Form submitted with HTTP status code: " + formResponse.getResponseCode());

      // Mark email as read
      msg.markRead();
    }

    // We are done with this thread, archive it
    GmailApp.moveThreadToArchive(thread);
  }
}
