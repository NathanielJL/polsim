/**
 * Legal Services Routes
 * Lawyer profession, bar admission, cases, and legal services
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/legal/take-bar-exam
 * Take bar exam (constitution-based questions)
 */
router.post('/take-bar-exam', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, answers } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.profession === 'lawyer') {
      return res.status(400).json({ error: 'Already a lawyer' });
    }
    
    // Check answers (questions sent from frontend)
    // Correct answers based on constitution
    const correctAnswers = [
      'A', // Q1: What is the supreme law?
      'C', // Q2: How many branches of government?
      'B', // Q3: Who can propose legislation?
      'A', // Q4: What is required for constitutional amendment?
      'C', // Q5: What are fundamental rights?
    ];
    
    let score = 0;
    if (answers && Array.isArray(answers)) {
      answers.forEach((answer: string, idx: number) => {
        if (answer === correctAnswers[idx]) {
          score++;
        }
      });
    }
    
    const passingScore = 4; // Must get 4/5 correct (80%)
    const passed = score >= passingScore;
    
    if (!passed) {
      return res.json({
        success: false,
        passed: false,
        score,
        total: correctAnswers.length,
        message: `Failed bar exam. Score: ${score}/${correctAnswers.length}. Need ${passingScore} to pass.`
      });
    }
    
    // Passed! Admit to bar for FREE
    player.profession = 'lawyer';
    
    if (!player.professionalCredentials) {
      player.professionalCredentials = {};
    }
    
    player.professionalCredentials.barAdmitted = true;
    player.professionalCredentials.cases = 0;
    player.professionalCredentials.licenses = ['General Practice'];
    
    await player.save();
    
    res.json({ 
      success: true,
      passed: true,
      score,
      total: correctAnswers.length,
      message: 'Passed bar exam! Admitted to the bar.',
      profession: 'lawyer',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/legal/bar-exam-questions
 * Get bar exam questions
 */
router.get('/bar-exam-questions', authMiddleware, async (req: Request, res: Response) => {
  try {
    // Constitution-based bar exam questions
    // User can send their constitution and we'll generate more questions
    const questions = [
      {
        id: 1,
        question: 'What is the supreme law of the land?',
        options: [
          'A) The Constitution',
          'B) Acts of Parliament',
          'C) Royal Decree',
          'D) Common Law'
        ],
        correctAnswer: 'A'
      },
      {
        id: 2,
        question: 'How many branches of government are established by the Constitution?',
        options: [
          'A) Two (Legislative and Executive)',
          'B) Four (Legislative, Executive, Judicial, Monarchical)',
          'C) Three (Legislative, Executive, Judicial)',
          'D) One (Unified Government)'
        ],
        correctAnswer: 'C'
      },
      {
        id: 3,
        question: 'Who has the power to propose legislation?',
        options: [
          'A) Only the Prime Minister',
          'B) Members of Parliament',
          'C) The Monarch',
          'D) The Supreme Court'
        ],
        correctAnswer: 'B'
      },
      {
        id: 4,
        question: 'What is required to amend the Constitution?',
        options: [
          'A) Two-thirds majority in Parliament and popular referendum',
          'B) Simple majority in Parliament',
          'C) Royal assent only',
          'D) Unanimous consent of all provinces'
        ],
        correctAnswer: 'A'
      },
      {
        id: 5,
        question: 'Which of the following is NOT a fundamental right under the Constitution?',
        options: [
          'A) Freedom of speech',
          'B) Right to property',
          'C) Right to government employment',
          'D) Right to fair trial'
        ],
        correctAnswer: 'C'
      }
    ];
    
    res.json({ questions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legal/service/contract
 * Draft a contract for a client
 */
router.post('/service/contract', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lawyerId, clientId, contractType, fee } = req.body;
    
    const lawyer = await models.Player.findById(lawyerId);
    if (!lawyer || lawyer.profession !== 'lawyer' || !lawyer.professionalCredentials?.barAdmitted) {
      return res.status(403).json({ error: 'Not a licensed lawyer' });
    }
    
    const client = await models.Player.findById(clientId);
    if (!client || client.cash < fee) {
      return res.status(400).json({ error: 'Client cannot afford fee' });
    }
    
    // Transfer payment
    client.cash -= fee;
    lawyer.cash += fee;
    
    // Increment case count
    if (lawyer.professionalCredentials.cases !== undefined) {
      lawyer.professionalCredentials.cases++;
    }
    
    await lawyer.save();
    await client.save();
    
    res.json({ 
      success: true,
      message: `Contract drafted: ${contractType}`,
      fee,
      lawyerCases: lawyer.professionalCredentials.cases 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legal/service/policy-review
 * Review a policy for legal compliance
 */
router.post('/service/policy-review', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lawyerId, policyId, fee } = req.body;
    
    const lawyer = await models.Player.findById(lawyerId);
    if (!lawyer || lawyer.profession !== 'lawyer') {
      return res.status(403).json({ error: 'Not a lawyer' });
    }
    
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const proposer = await models.Player.findById(policy.proposedBy);
    if (!proposer || proposer.cash < fee) {
      return res.status(400).json({ error: 'Cannot afford legal review' });
    }
    
    // Transfer payment
    proposer.cash -= fee;
    lawyer.cash += fee;
    
    if (lawyer.professionalCredentials?.cases !== undefined) {
      lawyer.professionalCredentials.cases++;
    }
    
    await lawyer.save();
    await proposer.save();
    
    // Generate legal opinion (simplified)
    const opinion = {
      policyId: policy.id,
      reviewedBy: lawyer.username,
      legalCompliance: 'Compliant', // Could add actual compliance logic
      recommendations: [
        'Consider impact on existing regulations',
        'Ensure constitutional alignment',
      ],
    };
    
    res.json({ 
      success: true,
      opinion,
      fee 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legal/service/corporate
 * Provide corporate legal services
 */
router.post('/service/corporate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lawyerId, companyId, serviceType, fee } = req.body;
    
    const lawyer = await models.Player.findById(lawyerId);
    if (!lawyer || lawyer.profession !== 'lawyer') {
      return res.status(403).json({ error: 'Not a lawyer' });
    }
    
    const company = await models.Company.findOne({ id: companyId });
    if (!company || company.cash < fee) {
      return res.status(400).json({ error: 'Company cannot afford service' });
    }
    
    // Transfer payment from company
    company.cash -= fee;
    lawyer.cash += fee;
    
    if (lawyer.professionalCredentials?.cases !== undefined) {
      lawyer.professionalCredentials.cases++;
    }
    
    await company.save();
    await lawyer.save();
    
    res.json({ 
      success: true,
      message: `Corporate service provided: ${serviceType}`,
      fee 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legal/service/court-representation
 * Represent client in court (when court system exists)
 */
router.post('/service/court-representation', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { lawyerId, clientId, caseType, fee } = req.body;
    
    const lawyer = await models.Player.findById(lawyerId);
    if (!lawyer || lawyer.profession !== 'lawyer') {
      return res.status(403).json({ error: 'Not a lawyer' });
    }
    
    const client = await models.Player.findById(clientId);
    if (!client || client.cash < fee) {
      return res.status(400).json({ error: 'Client cannot afford representation' });
    }
    
    // Transfer payment
    client.cash -= fee;
    lawyer.cash += fee;
    
    if (lawyer.professionalCredentials?.cases !== undefined) {
      lawyer.professionalCredentials.cases++;
    }
    
    await lawyer.save();
    await client.save();
    
    // Court case simulation (simplified)
    const outcome = Math.random() > 0.5 ? 'won' : 'lost';
    
    res.json({ 
      success: true,
      message: `Case ${outcome}`,
      caseType,
      outcome,
      fee 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/legal/lawyers/:sessionId
 * List all lawyers in session
 */
router.get('/lawyers/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const lawyers = await models.Player.find({ 
      sessionId,
      profession: 'lawyer',
      'professionalCredentials.barAdmitted': true 
    })
      .select('username cash professionalCredentials reputation')
      .lean();
    
    res.json({ lawyers });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/legal/lawyer/:id
 * Get lawyer's profile and case history
 */
router.get('/lawyer/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const lawyer = await models.Player.findById(id)
      .select('username profession professionalCredentials reputation cash')
      .lean();
    
    if (!lawyer || lawyer.profession !== 'lawyer') {
      return res.status(404).json({ error: 'Not a lawyer' });
    }
    
    res.json({ lawyer });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legal/specialize
 * Add legal specialization
 */
router.post('/specialize', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, specialization } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player || player.profession !== 'lawyer') {
      return res.status(403).json({ error: 'Not a lawyer' });
    }
    
    const validSpecializations = [
      'Corporate Law',
      'Criminal Defense',
      'Constitutional Law',
      'Contract Law',
      'Property Law',
      'Tax Law',
    ];
    
    if (!validSpecializations.includes(specialization)) {
      return res.status(400).json({ error: 'Invalid specialization' });
    }
    
    const specializationCost = 2000;
    
    if (player.cash < specializationCost) {
      return res.status(400).json({ error: 'Cannot afford specialization' });
    }
    
    player.cash -= specializationCost;
    
    if (!player.professionalCredentials?.licenses) {
      if (!player.professionalCredentials) {
        player.professionalCredentials = {};
      }
      player.professionalCredentials.licenses = [];
    }
    
    if (!player.professionalCredentials.licenses.includes(specialization)) {
      player.professionalCredentials.licenses.push(specialization);
    }
    
    await player.save();
    
    res.json({ 
      success: true,
      message: `Specialized in ${specialization}`,
      licenses: player.professionalCredentials.licenses,
      newBalance: player.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
