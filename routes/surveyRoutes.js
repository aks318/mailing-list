const _ = require('lodash')
const {Path} = require('path-parser')
const {URL} = require('url')

const mongoose = require('mongoose')

const requireLogin = require('../middlewares/requireLogin')

const Mailer = require('../services/Mailer')
const surveyTemplate = require('../services/emailTemplates/surveyTemplate')
const { compact } = require('lodash')
const welcomTemplate = require('../services/emailTemplates/welcomTemplate')

const Survey = mongoose.model('surveys')

module.exports = app =>{

    app.get('/api/surveys' , requireLogin , async(req, res) =>{
        const surveys = await Survey.find({_user : req.user.id}).select({recipients : false})

        res.send(surveys)
    })

    app.get('/api/surveys/:surveyId/:choice' , (req , res) =>{
        res.send('Thanks for voting!')
    })

    app.post('/api/surveys/webhooks' , (req , res) =>{

        const p = new Path('/api/surveys/:surveyId/:choice')

        _.chain(req.body)
            .map( ({email , url}) =>{
                
                const match = p.test(new URL(url).pathname)
                if(match){
                    return {email, surveyId: match.surveyId, choice: match.choice}
                }
            })
            .compact()   // removes null
            .uniqBy('email' , 'surveyId')
            .each(({surveyId , email , choice}) =>{
                Survey.updateOne({
                    _id : surveyId,
                    recipients : {
                        $elemMatch: {
                            email: email, responded: false
                        }
                        
                    }
                } , {
                    $inc : { [choice] : 1},
                    $set : {'recipients.$.responded' : true},
                    lastResponded : new Date()
                }).exec()
            })
            .value()

        res.send({})
    })


    app.post('/api/surveys' ,  requireLogin , async (req ,res) =>{
        const { title , subject , body , recipients } = req.body

        const survey = new Survey({
            title,    // identical value can be condensed in ES6
            subject,
            body,
            recipients : recipients.split(',').map(email => ({email: email.trim()})),
            _user: req.user.id,
            dateSent : Date.now()
        })

        
        //Great Place to send an email

        const mailer = new Mailer(survey , surveyTemplate(survey))
        // const welcomeMailer = new Mailer(survey , welcomTemplate(survey))

        try{

        
            await mailer.send()
            await survey.save()
            const user = await req.user.save()

            res.send(user)
        }
        catch (err){
            res.status(422).send(err)
        }
        

    })
}