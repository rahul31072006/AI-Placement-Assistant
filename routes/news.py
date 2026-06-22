from fastapi import APIRouter
from news import get_internship_news, get_mnc_news

router = APIRouter(
    prefix="/news",
    tags=["News"]
)


@router.get("/mnc")
def mnc_news():
    return get_mnc_news()


@router.get("/internship")
def internship_news():
    return get_internship_news()
