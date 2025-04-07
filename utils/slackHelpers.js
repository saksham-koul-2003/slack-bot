// Returns a Slack Modal for approval request
export const buildApprovalModal = () => {
    return {
      type: "modal",
      callback_id: "approval_modal",
      title: {
        type: "plain_text",
        text: "Request Approval",
      },
      submit: {
        type: "plain_text",
        text: "Submit",
      },
      close: {
        type: "plain_text",
        text: "Cancel",
      },
      blocks: [
        {
          type: "input",
          block_id: "approver_block",
          element: {
            type: "users_select",
            placeholder: {
              type: "plain_text",
              text: "Select a user",
            },
            action_id: "user_select",
          },
          label: {
            type: "plain_text",
            text: "Select Approver",
          },
        },
        {
          type: "input",
          block_id: "text_block",
          element: {
            type: "plain_text_input",
            multiline: true,
            action_id: "input_text",
          },
          label: {
            type: "plain_text",
            text: "Approval Text",
          },
        },
      ],
    };
  };
  