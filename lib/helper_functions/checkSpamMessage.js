const GroupChatMessage = require('../models/GroupChatMessage');
const Organization = require('../models/Organization');
const User = require('../models/User');

const keywords = [
  '100% more',
  '100% free',
  '100% satisfied',
  'Additional income',
  'Be your own boss',
  'Best price',
  'Big bucks',
  'Billion',
  'Cash bonus',
  'Cents on the dollar',
  'Consolidate debt',
  'Double your cash',
  'Double your income',
  'Earn extra cash',
  'Earn money',
  'Eliminate bad credit',
  'Extra cash',
  'Extra income',
  'Expect to earn',
  'Fast cash',
  'Financial freedom',
  'Free access',
  'Free consultation',
  'Free gift',
  'Free hosting',
  'Free info',
  'Free investment',
  'Free membership',
  'Free money',
  'Free preview',
  'Free quote',
  'Free trial',
  'Full refund',
  'Get out of debt',
  'Get paid',
  'Giveaway',
  'Guaranteed',
  'Increase sales',
  'Increase traffic',
  'Incredible deal',
  'Lower rates',
  'Lowest price',
  'Make money',
  'Million dollars',
  'Miracle',
  'Money back',
  'Once in a lifetime',
  'One time',
  'Pennies a day',
  'Potential earnings',
  'Prize',
  'Promise',
  'Pure profit',
  'Risk-free',
  'Satisfaction guaranteed',
  'Save big money',
  'Save up to',
  'Special promotion',
  'Act now',
  'Apply now',
  'Act now',
  'Apply now',
  'Become a member',
  'Call now',
  'Click below',
  'Click here',
  'Get it now',
  'Do it today',
  'Don’t delete',
  'Exclusive deal',
  'Get started now',
  'Important information regarding',
  'Information you requested',
  'Instant',
  'Limited time',
  'New customers only',
  'Order now',
  'Please read',
  'See for yourself',
  'Sign up free',
  'Take action',
  'This won’t last',
  'Urgent',
  'What are you waiting for?',
  'While supplies last',
  'Will not believe your eyes',
  'Winner',
  'Winning',
  'You are a winner',
  'You have been selected',
  'Accept credit cards',
  'Ad',
  'All new',
  'As seen on',
  'Bargain',
  'Beneficiary',
  'Billing',
  'Bonus',
  'Cards accepted',
  'Cash',
  'Certified',
  'Cheap',
  'Claims',
  'Clearance',
  'Compare rates',
  'Credit card offers',
  'Deal',
  'Debt',
  'Discount',
  'Fantastic',
  'In accordance with laws',
  'Income',
  'Investment',
  'Join millions',
  'Lifetime',
  'Loans',
  'Luxury',
  'Marketing solution',
  'Message contains',
  'Mortgage rates',
  'Name brand',
  'Offer',
  'Online marketing',
  'Opt in',
  'Pre-approved',
  'Quote',
  'Rates',
  'Refinance',
  'Removal',
  'Reserves the right',
  'Score',
  'Search engine',
  'Sent in compliance',
  'Subject to…',
  'Terms and conditions',
  'Trial',
  'Unlimited',
  'Warranty',
  'Web traffic',
  'Work from home',
];

const checkSpamMessage = async (args, chat, user) => {
  // if plugin is installed for checking whether the message is spam or not, then this condition will take care of this case.
  if (args.isSpam != undefined) {
    if (args.isSpam) {
      const orgId = chat.organization;
      const org = await Organization.findById(orgId);
      await Organization.findByIdAndUpdate(orgId, {
        spamCount: [
          ...org.spamCount,
          { user, isReaded: false, groupchat: chat },
        ],
      });

      const isAlreadySpammed = user.spamInOrganizations.includes(orgId);

      if (!isAlreadySpammed) {
        await User.findByIdAndUpdate(user._id, {
          spamInOrganizations: [...user.spamInOrganizations, orgId],
        });
      }
    }
    return;
  }

  const { chatId, messageContent } = args;

  const isKeywordSpam = keywords.some((keyword) =>
    messageContent.toLowerCase().includes(keyword.toLowerCase())
  );

  const previousMessages = await GroupChatMessage.find({
    groupChatMessageBelongsTo: chatId,
  })
    .sort({ createdAt: -1 })
    .limit(30);

  let isFrequencySpam = false;

  if (previousMessages.length >= 30) {
    let prevTime = previousMessages[0].createdAt;

    for (let i = 1; i < previousMessages.length; i++) {
      let currTime = previousMessages[i].createdAt;
      let diff = (prevTime.getTime() - currTime.getTime()) / 1000;
      diff < 5 ? (isFrequencySpam = true) : (isFrequencySpam = false);
      prevTime = currTime;
    }
  }

  if (isKeywordSpam || isFrequencySpam) {
    const orgId = chat.organization;
    const org = await Organization.findById(orgId);
    await Organization.findByIdAndUpdate(orgId, {
      spamCount: [...org.spamCount, { user, isReaded: false, groupchat: chat }],
    });

    const isAlreadySpammed = user.spamInOrganizations.includes(orgId);

    if (!isAlreadySpammed) {
      await User.findByIdAndUpdate(user._id, {
        spamInOrganizations: [...user.spamInOrganizations, orgId],
      });
    }
  }
};

module.exports = checkSpamMessage;
