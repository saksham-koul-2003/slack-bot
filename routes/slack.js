import express from 'express';
import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

// Slash command endpoint
router.post('/slash', async (req, res) => {
  try {
    console.log('Slash command received:', req.body); // ✅ Debug line

    const { trigger_id } = req.body;
    if (!trigger_id) {
      return res.status(400).send("Missing trigger_id");
    }

    const modalView = {
      type: 'modal',
      callback_id: 'approval_modal',
      title: { type: 'plain_text', text: 'Request Approval' },
      submit: { type: 'plain_text', text: 'Submit' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        {
          type: 'input',
          block_id: 'approver_block',
          label: { type: 'plain_text', text: 'Select Approver' },
          element: {
            type: 'users_select',
            action_id: 'approver',
          },
        },
        {
          type: 'input',
          block_id: 'approval_text_block',
          label: { type: 'plain_text', text: 'Approval Text' },
          element: {
            type: 'plain_text_input',
            multiline: true,
            action_id: 'approval_text',
          },
        },
      ],
    };

    // Open modal
    await axios.post('https://slack.com/api/views.open', {
      trigger_id,
      view: modalView,
    }, {
      headers: {
        Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    return res.status(200).send(); // Respond quickly to Slack
  } catch (err) {
    console.error('Error opening modal:', err.message);
    return res.status(500).send('Internal Server Error');
  }
});

// Interactivity endpoint
router.post('/interact', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const { type, view, user, actions } = payload;

  // Handle modal submission
  if (type === 'view_submission') {
    const approverId = view.state.values.approver_block.approver.selected_user;
    const approvalText = view.state.values.approval_text_block.approval_text.value;
    const requesterId = user.id;

    // Send approval request to approver
    try {
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: approverId,
        text: `*Approval Request from <@${requesterId}>:* \n"${approvalText}"`,
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Approval Request from <@${requesterId}>:* \n"${approvalText}"`
            }
          },
          {
            type: "actions",
            block_id: "approval_buttons",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Approve"
                },
                style: "primary",
                value: JSON.stringify({ requesterId }),
                action_id: "approve"
              },
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text: "Reject"
                },
                style: "danger",
                value: JSON.stringify({ requesterId }),
                action_id: "reject"
              }
            ]
          }
        ]
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      return res.status(200).send();
    } catch (error) {
      console.error('Error sending approval message:', error.message);
      return res.status(500).send();
    }
  }

  // Handle button actions
  if (type === 'block_actions' && actions?.length > 0) {
    const action = actions[0];
    const { action_id, value } = action;
    const { requesterId } = JSON.parse(value);

    const resultText = action_id === 'approve' ? 'approved ✅' : 'rejected ❌';

    // Notify requester
    try {
      await axios.post('https://slack.com/api/chat.postMessage', {
        channel: requesterId,
        text: `Your request was *${resultText}* by <@${user.id}>`,
      }, {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json',
        },
      });

      return res.status(200).send();
    } catch (error) {
      console.error('Error notifying requester:', error.message);
      return res.status(500).send();
    }
  }

  return res.status(200).send(); // Always respond
});

export default router;
