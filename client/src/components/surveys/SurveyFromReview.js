import _ from 'lodash'
import React from 'react'
import { connect } from 'react-redux'
import formFields from './formFields'
import { withRouter } from 'react-router-dom'
import * as actions from '../../actions/index'

function SurveyFormReview({onCancel , formvalues, submitSurvey , history}) {

    const reviewFields = _.map(formFields , ({name , label}) => {
        return(
            <div key = {name}>
                <label>
                    {label}
                </label>
                <div>
                    {formvalues[name]}
                </div>
            </div>
        )
    })

    return (
        <div>
            <h5>Please Confirm your entries</h5>
            {reviewFields}
            <button className = "yellow darken-2 white-text btn-flat" onClick = {onCancel}>Back</button>
            <button
            onClick = {() =>submitSurvey(formvalues , history)}
             className = "green btn-flat white-text right">Send Survey
                <i className= "material-icons right">email</i>
            </button>

        </div>
    )
}

function mapStateToProps(state){
    return {formvalues : state.form.surveyForm.values}
}

export default connect(mapStateToProps , actions) (withRouter(SurveyFormReview))
