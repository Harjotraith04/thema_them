from langchain_text_splitters import RecursiveCharacterTextSplitter

def create_chunks(text: str, chunk_size: int = 2500, chunk_overlap: int = 150) -> list[str]:
    return RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", ".", " "],
        
    ).split_text(text)