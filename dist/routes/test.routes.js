"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const router = express_1.default.Router();
router.get('/render', (req, res) => {
    try {
        const content = {
            landing: {
                fullName: 'Kara Howard',
                title: 'SI<3> Co-Founder',
                headline: '& I create accessible platforms for the new economy.',
                hashTags: ['collaboration', 'inclusion', 'impact', 'transparency', 'accessibility '],
                region: 'North America',
                organizationAffiliations: ['SI<3>'],
                communityAffiliations: ['Si Her', 'BitQueens'],
                superPowers: ['Empathy', 'Focus', 'Leaps of Faith'],
                image: 'https://res.cloudinary.com/dv52zu7pu/image/upload/v1751386821/girl_ainxhw.png',
                pronoun: 'SHE/HER'
            },
            slider: ['Accessible Platforms', 'Collaborative Growth ', 'Inclusive Ecosystems ', 'Infinite Potential '],
            value: { experience: 'As the Ecosystem Growth Lead of SI<3>, I bring twelve years in womxn-in-tech community leadership, and fifteen years in growth and partnerships development in emerging technology. I am a strong ecosystem builder and connecter, and enjoy creating collaborative value with community networks and product integrations. I am very values-driven in business and in my life, and maintain a solid connection to my inner guidance system as I navigate the complexities of creating value in the new economy.', values: 'My vision is for an equitable new economy.' },
            live: { image: 'https://res.cloudinary.com/dq033xs8n/image/upload/v1751646472/elxegcjsioitde3fam3u.png', url: 'https://res.cloudinary.com/dv52zu7pu/video/upload/v1751386825/vid_vxw5em.mp4', walletUrl: 'https://pb.aurpay.net/pb/page/html/paymentbutton.html?token=pb_plugin_link_token_h6hzBGgZzFW1G5eO', details: [{ title: 'SI<3>', heading: "SI<3>'s Mission", body: '' }, { title: 'Wirex', heading: "How True is Web3's Commitment to Diversity and Inclusion", body: '' }, { title: 'W3B Talks', heading: 'Diversity in the New Economy', body: '' }] },
            organizations: ['https://res.cloudinary.com/dq033xs8n/image/upload/v1751647251/wfhk7vb6zvvvrgsbpwl8.png', 'https://res.cloudinary.com/dq033xs8n/image/upload/v1751647255/ekvgnk1bhp7p9vnbena8.png', 'https://res.cloudinary.com/dq033xs8n/image/upload/v1751647258/g0l3pu2sz4tttcnxg6kr.png', 'https://res.cloudinary.com/dq033xs8n/image/upload/v1751647262/tsypmpiqmx51nopyag6d.png'],
            timeline: [{ title: 'Co-Creating SI<3>', to: 'PRESENT', from: '2023' }, { title: 'Personal Development Retreat', to: '', from: '2022' }, { title: 'Managed the Feminine Intelligence', to: '2021', from: '2017' }, { title: 'VP of Growth & Partnerships at Clevertap', to: '2019', from: '2015' }, { title: 'MBA from NYU Stern & Marketing Entrepreneurship', to: '', from: '2012' }, { title: 'BSC from UW Madison - Personal Finance', to: '', from: '2004' }, { title: 'Equity Research Associate / Financial Analyst', to: '2010', from: '2002' }],
            available: { avatar: 'https://res.cloudinary.com/dv52zu7pu/image/upload/v1751386807/avatar_vpdoef.png', availableFor: ['collaboration', 'advising', 'speaking'], ctaUrl: 'https://www.si3.space', ctaText: 'hello world' },
            socialChannels: [{ url: 'https://www.linkedin.com/in/decentralizing/', icon: 'https://res.cloudinary.com/dv52zu7pu/image/upload/v1751386798/LinkedIn_mrnvct.svg' }, { url: 'https://x.com/si3_ecosystem', icon: 'https://res.cloudinary.com/dv52zu7pu/image/upload/v1751386803/Twitter_btmxyb.svg' }]
        };
        const templateFile = fs_1.default.readFileSync(path_1.default.join(__dirname, '../template/index.ejs'), 'utf-8');
        const template = ejs_1.default.compile(templateFile);
        const renderedTemplate = template(content);
        if (!renderedTemplate.includes('<html'))
            throw new Error('Render check failed: Template produced empty or invalid output.');
        console.log('[Render Route] Template rendered successfully.');
        const filename = `${content.landing.fullName.replace(/\s+/g, '-')}.html`;
        const tempDir = path_1.default.join(__dirname, '../temp');
        const filePath = path_1.default.join(tempDir, filename);
        if (!fs_1.default.existsSync(tempDir))
            fs_1.default.mkdirSync(tempDir, { recursive: true });
        fs_1.default.writeFileSync(filePath, renderedTemplate, 'utf-8');
        console.log(`[Render Route] File write operation completed for ${filePath}`);
        const savedFileContent = fs_1.default.readFileSync(filePath, 'utf-8');
        if (savedFileContent !== renderedTemplate)
            throw new Error('Save verification failed: The content on disk does not match the rendered content.');
        console.log('[Render Route] File save verified successfully.');
        return res.status(200).json({ message: 'Template rendered and saved successfully', filename, path: filePath });
    }
    catch (error) {
        console.error('Error in /render route:', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
});
exports.default = router;
