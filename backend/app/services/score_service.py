SEVERITY_WEIGHTS = {

    "low": 1,

    "medium": 2,

    "high": 3,

    "critical": 4

}


def calculate_compliance_score(results):

    """
    Calculate a severity-weighted compliance score.

    Status treatment:

        matched  -> 100% compliance credit

        review   -> 50% compliance credit

        missing  -> 0% compliance credit

    Higher-severity requirements have a greater impact

    on the final compliance score.

    Review requirements receive partial credit because

    potentially relevant evidence was found, but automatic

    compliance could not be confirmed.

    """

    if not results:

        return {

            "score": 0,

            "total_requirements": 0,

            "matched_requirements": 0,

            "missing_requirements": 0

        }

    total_weight = 0

    compliance_weight = 0

    matched_requirements = 0

    missing_requirements = 0

    for result in results:

        severity = result.get(

            "severity",

            "medium"

        ).lower()

        weight = SEVERITY_WEIGHTS.get(

            severity,

            2

        )

        total_weight += weight

        status = result.get(

            "status",

            "missing"

        ).lower()

        if status == "matched":

            compliance_weight += weight

            matched_requirements += 1

        elif status == "review":

            compliance_weight += weight * 0.5

        elif status == "missing":

            missing_requirements += 1

    if total_weight == 0:

        score = 0

    else:

        score = (

            compliance_weight / total_weight

        ) * 100

    return {

        "score": round(score, 2),

        "total_requirements": len(results),

        "matched_requirements": matched_requirements,

        "missing_requirements": missing_requirements

    }